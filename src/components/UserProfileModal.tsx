"use client";

import React, { useState, useEffect } from "react";
import { X, User, FileText, Check, Edit2 } from "lucide-react";

interface UserProfileModalProps {
  onClose: () => void;
}

export default function UserProfileModal({ onClose }: UserProfileModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"persona" | "resume">("persona");
  
  const [persona, setPersona] = useState("");
  const [resumeText, setResumeText] = useState("");
  
  const [isEditingPersona, setIsEditingPersona] = useState(false);
  const [isEditingResume, setIsEditingResume] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/user/profile", {
          headers: { "X-User-Id": "demo-user-123" },
        });
        const json = await res.json();
        if (json.code === 200) {
          setPersona(json.data.persona);
          setResumeText(json.data.resumeText);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (type: "persona" | "resume") => {
    setIsSaving(true);
    try {
      const payload = type === "persona" ? { persona } : { resumeText };
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": "demo-user-123",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (type === "persona") setIsEditingPersona(false);
        else setIsEditingResume(false);
      } else {
        alert("保存失败");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("保存时发生错误");
    } finally {
      setIsSaving(false);
    }
  };

  // 使用 React Portal 将 Modal 挂载到 body 末尾，脱离 Navbar 的 stacking context
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            个人档案与画像中心
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 pt-4 bg-white">
          <button
            className={`pb-3 px-4 font-medium text-sm transition-colors border-b-2 ${
              activeTab === "persona" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab("persona")}
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" /> AI 提炼画像
            </div>
          </button>
          <button
            className={`pb-3 px-4 font-medium text-sm transition-colors border-b-2 ${
              activeTab === "resume" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab("resume")}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" /> 简历与背景库
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30 custom-scrollbar">
          {isLoading ? (
            <div className="h-40 flex items-center justify-center text-gray-500">加载中...</div>
          ) : (
            <div className="space-y-4">
              {activeTab === "persona" && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-gray-500">
                      这段画像由成绩单分析自动生成，它将作为全局设定，在 AI 面试和职业推荐中为你提供个性化体验。
                    </p>
                    {!isEditingPersona ? (
                      <button onClick={() => setIsEditingPersona(true)} className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                        <Edit2 className="w-4 h-4" /> 修改
                      </button>
                    ) : (
                      <button onClick={() => handleSave("persona")} disabled={isSaving} className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1">
                        <Check className="w-4 h-4" /> {isSaving ? "保存中" : "完成"}
                      </button>
                    )}
                  </div>
                  
                  {isEditingPersona ? (
                    <textarea
                      value={persona}
                      onChange={(e) => setPersona(e.target.value)}
                      className="w-full h-48 p-4 bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none text-gray-700"
                      placeholder="在此处维护你的核心技术栈、性格特点、优劣势等..."
                    />
                  ) : (
                    <div className="w-full min-h-[12rem] p-5 bg-blue-50/50 border border-blue-100 rounded-xl text-gray-700 leading-relaxed">
                      {persona || <span className="text-gray-400 italic">暂无画像数据，请前往首页上传成绩单生成，或手动在此编辑补充。</span>}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "resume" && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-gray-500">
                      你可以将你的简历文本、项目经历、获奖情况粘贴在这里。AI 面试官在提问时会重点参考这些背景。
                    </p>
                    {!isEditingResume ? (
                      <button onClick={() => setIsEditingResume(true)} className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                        <Edit2 className="w-4 h-4" /> 修改
                      </button>
                    ) : (
                      <button onClick={() => handleSave("resume")} disabled={isSaving} className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1">
                        <Check className="w-4 h-4" /> {isSaving ? "保存中" : "完成"}
                      </button>
                    )}
                  </div>
                  
                  {isEditingResume ? (
                    <textarea
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      className="w-full h-64 p-4 bg-white border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none text-gray-700 text-sm"
                      placeholder="粘贴你的简历纯文本、实习经历、校园项目..."
                    />
                  ) : (
                    <div className="w-full min-h-[16rem] p-5 bg-purple-50/30 border border-purple-100 rounded-xl text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                      {resumeText || <span className="text-gray-400 italic">暂无简历信息，点击修改按钮将你的简历文本粘贴至此。</span>}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // 如果是在浏览器环境，则使用 createPortal 渲染到 body，否则返回 null
  if (typeof document !== 'undefined') {
    const { createPortal } = require('react-dom');
    return createPortal(modalContent, document.body);
  }
  return null;
}
