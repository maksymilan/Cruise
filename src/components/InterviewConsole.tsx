"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { Send, User, Bot, AlertTriangle, Clock, History, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useSearchParams } from "next/navigation";
import { useUserId } from "@/lib/useUserId";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
}

function InterviewConsoleInner() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") || "后端开发工程师";
  const userId = useUserId();

  const [targetRole, setTargetRole] = useState(initialRole);
  const [duration, setDuration] = useState(30); // 面试时长（分钟）
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  
  const [isInitializing, setIsInitializing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 面试倒计时 30 分钟

  // 历史记录相关状态
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [viewingHistoryDetail, setViewingHistoryDetail] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 面试倒计时器
  useEffect(() => {
    if (!sessionId || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [sessionId, timeLeft]);

  // 加载历史记录
  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch("/api/interview/history", {
        headers: { "X-User-Id": userId }
      });
      const data = await res.json();
      if (data.code === 200) {
        setHistoryList(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (showHistoryModal) {
      loadHistory();
    }
  }, [showHistoryModal]);

  // 加载单条历史详情
  const viewHistoryDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/interview/history/${id}`, {
        headers: { "X-User-Id": userId }
      });
      const data = await res.json();
      if (data.code === 200) {
        setViewingHistoryDetail(data.data);
      } else {
        alert("无法加载详情");
      }
    } catch (error) {
      console.error(error);
      alert("网络错误");
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // 初始化面试
  const handleStartInterview = async () => {
    setIsInitializing(true);
    setMessages([]);
    setReportData(null);
    try {
      const res = await fetch("/api/interview/init", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-Id": userId },
        body: JSON.stringify({ targetRole, resumeContext: "大三学生，有过简单的校园项目经验" })
      });
      const data = await res.json();
      if (data.code === 200) {
        setSessionId(data.data.sessionId);
        setMessages([{ id: Date.now().toString(), role: "ai", content: data.data.aiMessage }]);
        setTimeLeft(duration * 60); // 根据选择设置倒计时
      } else {
        alert(data.message || "初始化失败");
      }
    } catch (error) {
      console.error(error);
      alert("网络错误");
    } finally {
      setIsInitializing(false);
    }
  };

  // 结束面试生成报告
  const handleEndInterview = async () => {
    if (!sessionId) return;
    if (!confirm("结束面试后将生成评估报告，确定结束吗？")) return;
    
    setIsGeneratingReport(true);
    try {
      const res = await fetch("/api/interview/report", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-Id": userId },
        body: JSON.stringify({ sessionId })
      });
      const data = await res.json();
      if (data.code === 200) {
        setReportData(data.data);
      } else {
        alert(data.message || "报告生成失败");
      }
    } catch (error) {
      console.error(error);
      alert("网络错误，无法生成报告");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // 发送消息并接收 SSE 流式响应
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isGenerating || !sessionId) return;

    const userMsgText = inputValue.trim();
    setInputValue("");
    
    // 立即在前端展示用户发送的消息
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: userMsgText };
    setMessages((prev) => [...prev, userMsg]);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/interview/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-Id": userId },
        body: JSON.stringify({ sessionId, content: userMsg.content })
      });

      if (!response.ok) throw new Error("请求失败");
      if (!response.body) throw new Error("没有流体响应");

      // 为 AI 准备一条空消息对象，随后不断追加
      const aiMsgId = (Date.now() + 1).toString();
      setMessages((prev) => [...prev, { id: aiMsgId, role: "ai", content: "" }]);

      // 处理 ReadableStream
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let buffer = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          
          // SSE 格式解析 (以 data: 开头，以 \n\n 结尾)
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.error) {
                  throw new Error(data.error);
                }

                if (!data.isFinished && data.chunk) {
                  // 更新最后一条 AI 消息的内容（打字机效果）
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];
                    if (lastMsg && lastMsg.role === "ai") {
                      // 必须返回新对象，不能直接修改 lastMsg.content，否则 React 严格模式下会导致双字重复
                      newMessages[newMessages.length - 1] = {
                        ...lastMsg,
                        content: lastMsg.content + data.chunk
                      };
                    }
                    return newMessages;
                  });
                }
              } catch (parseError) {
                console.error("SSE parse error:", parseError);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: "ai", content: "*(网络连接异常，面试官掉线了)*" }]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto h-[80vh] flex flex-col bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
      
      {/* 顶部控制栏 */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800 text-lg leading-tight">沉浸式压力面</h2>
            <p className="text-xs text-gray-500">AI 考官将根据你的回答进行深挖与施压</p>
          </div>
        </div>

        {sessionId ? (
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-medium border ${
              timeLeft < 300 ? "bg-red-50 text-red-600 border-red-200 animate-pulse" : "bg-white text-gray-700 border-gray-200"
            }`}>
              <Clock className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
            <button 
              onClick={handleEndInterview}
              disabled={isGeneratingReport}
              className="px-4 py-1.5 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isGeneratingReport ? "生成中..." : "结束面试"}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowHistoryModal(true)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors mr-2 flex items-center gap-1"
            >
              <History className="w-4 h-4" />
              历史记录
            </button>
            <select 
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm w-24 outline-none focus:border-blue-500 bg-white"
            >
              <option value={15}>15 分钟</option>
              <option value={30}>30 分钟</option>
              <option value={45}>45 分钟</option>
              <option value={60}>60 分钟</option>
            </select>
            <select 
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm w-40 outline-none focus:border-blue-500 bg-white"
            >
              <option value="后端开发工程师">后端开发工程师</option>
              <option value="前端开发工程师">前端开发工程师</option>
              <option value="全栈开发工程师">全栈开发工程师</option>
              <option value="算法工程师">算法工程师</option>
              <option value="数据分析师">数据分析师</option>
              <option value="产品经理">产品经理</option>
              <option value="UI/UX设计师">UI/UX设计师</option>
              <option value="软件测试工程师">软件测试工程师</option>
              <option value="运维工程师">运维工程师</option>
            </select>
            <button 
              onClick={handleStartInterview}
              disabled={isInitializing || !targetRole}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isInitializing ? "连接考官中..." : "开始面试"}
            </button>
          </div>
        )}
      </div>

      {/* 聊天记录区域 */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 custom-scrollbar space-y-6">
        {!sessionId ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <Bot className="w-16 h-16 mb-4 text-gray-300 opacity-50" />
            <p>请在右上角选择目标岗位并点击开始面试</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                msg.role === "user" ? "bg-blue-600 text-white" : "bg-orange-500 text-white"
              }`}>
                {msg.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className={`max-w-[75%] rounded-2xl px-5 py-3.5 shadow-sm ${
                msg.role === "user" 
                  ? "bg-blue-600 text-white rounded-tr-none" 
                  : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
              }`}>
                {msg.role === "ai" ? (
                  <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-100 prose-pre:text-gray-800 break-words">
                    <ReactMarkdown>{msg.content || "..."}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入控制区 */}
      <div className="p-4 bg-white border-t border-gray-100">
        <form 
          onSubmit={handleSendMessage}
          className={`relative flex items-end gap-2 bg-gray-50 border rounded-2xl p-2 transition-colors ${
            isGenerating ? "border-gray-200 opacity-60" : "border-gray-200 hover:border-blue-400 focus-within:border-blue-500 focus-within:bg-white focus-within:shadow-sm"
          }`}
        >
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={!sessionId || isGenerating}
            placeholder={
              !sessionId ? "请先开始面试" : 
              isGenerating ? "考官正在思考..." : 
              "输入你的回答 (支持换行，Shift+Enter 发送)"
            }
            className="flex-1 max-h-32 min-h-[44px] bg-transparent resize-none outline-none py-2 px-3 text-gray-800 text-sm disabled:cursor-not-allowed custom-scrollbar"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || !sessionId || isGenerating}
            className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-xl transition-colors shrink-0 shadow-sm disabled:shadow-none"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <div className="text-center mt-2">
          <span className="text-xs text-gray-400">支持 Shift + Enter 快捷发送</span>
        </div>
      </div>
      {/* 面试报告弹窗 */}
      {reportData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">面试评估报告</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full text-blue-700 font-bold">
                  <span>综合评分:</span>
                  <span className="text-2xl">{reportData.score}</span>
                </div>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <div>
                <h4 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">总体评价</h4>
                <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl">{reportData.summary}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-bold text-green-600 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    优势与亮点
                  </h4>
                  <ul className="space-y-2">
                    {reportData.strengths?.map((item: string, i: number) => (
                      <li key={i} className="text-gray-700 text-sm flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-bold text-red-500 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    不足与短板
                  </h4>
                  <ul className="space-y-2">
                    {reportData.weaknesses?.map((item: string, i: number) => (
                      <li key={i} className="text-gray-700 text-sm flex items-start gap-2">
                        <span className="text-red-400 mt-0.5">✗</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-bold text-blue-600 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  改进建议
                </h4>
                <div className="bg-blue-50 rounded-xl p-4">
                  <ul className="space-y-3">
                    {reportData.suggestions?.map((item: string, i: number) => (
                      <li key={i} className="text-blue-900 text-sm flex items-start gap-2">
                        <span className="font-bold text-blue-400">{i + 1}.</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button 
                onClick={() => {
                  setReportData(null);
                  setSessionId(null);
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                完成并返回
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 历史记录列表弹窗 */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">历史面试记录</h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              {isLoadingHistory ? (
                <div className="text-center text-gray-500 py-10">加载中...</div>
              ) : historyList.length === 0 ? (
                <div className="text-center text-gray-500 py-10">暂无面试记录</div>
              ) : (
                <div className="space-y-4">
                  {historyList.map((item) => (
                    <div 
                      key={item.id} 
                      className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all bg-gray-50"
                      onClick={() => viewHistoryDetail(item.id)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-800">{item.targetRole}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${item.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {item.status === 'completed' ? '已完成' : '未完成'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>{new Date(item.createdAt).toLocaleString()}</span>
                        {item.status === 'completed' && item.reportData && (
                          <span className="font-medium text-blue-600">评分: {JSON.parse(item.reportData).score}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 单条历史记录回放弹窗 */}
      {viewingHistoryDetail && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-800">面试回放：{viewingHistoryDetail.targetRole}</h3>
                <p className="text-xs text-gray-500">{new Date(viewingHistoryDetail.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                {viewingHistoryDetail.reportData && (
                  <button 
                    onClick={() => {
                      setReportData(JSON.parse(viewingHistoryDetail.reportData));
                      setViewingHistoryDetail(null);
                    }}
                    className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-medium rounded-lg"
                  >
                    查看评估报告
                  </button>
                )}
                <button onClick={() => setViewingHistoryDetail(null)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 custom-scrollbar space-y-6">
              {viewingHistoryDetail.messages?.map((msg: any) => (
                <div key={msg.id} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                    msg.role === "user" ? "bg-blue-600 text-white" : "bg-orange-500 text-white"
                  }`}>
                    {msg.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                  <div className={`max-w-[75%] rounded-2xl px-5 py-3.5 shadow-sm ${
                    msg.role === "user" 
                      ? "bg-blue-600 text-white rounded-tr-none" 
                      : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
                  }`}>
                    {msg.role === "ai" ? (
                      <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-100 prose-pre:text-gray-800 break-words">
                        <ReactMarkdown>{msg.content || "..."}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {(!viewingHistoryDetail.messages || viewingHistoryDetail.messages.length === 0) && (
                <div className="text-center text-gray-500 py-10">暂无对话内容</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InterviewConsole() {
  return (
    <Suspense fallback={<div className="h-[80vh] flex items-center justify-center text-gray-500">加载面试组件中...</div>}>
      <InterviewConsoleInner />
    </Suspense>
  );
}
