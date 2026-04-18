"use client";

import { useState } from "react";
import UploadTranscript from "@/components/UploadTranscript";
import AbilityRadarChart, { RadarData } from "@/components/AbilityRadarChart";
import EditablePersonaPath from "@/components/EditablePersonaPath";
import { CheckCircle2, BookOpen, Brain, Briefcase, Code } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [isUploading, setIsUploading] = useState(false);
  const [parsedResult, setParsedResult] = useState<string | null>(null);
  const [radarData, setRadarData] = useState<RadarData | null>(null);
  const [advice, setAdvice] = useState<any>(null); // 添加建议数据状态
  const [detailedGuide, setDetailedGuide] = useState<string | null>(null); // 新增：详细指导文档状态
  const [inferredGrade, setInferredGrade] = useState<string | null>(null); // 新增：推断年级状态
  
  // 新增：报告的 ID、个人画像和职业规划路径
  const [reportId, setReportId] = useState<string | null>(null);
  const [persona, setPersona] = useState<string>("");
  const [careerPath, setCareerPath] = useState<any[]>([]);

  // 真实上传和解析流程
  const handleUploadStart = async (file: File) => {
    setIsUploading(true);
    setParsedResult(null);
    setRadarData(null);
    setAdvice(null);
    setDetailedGuide(null);
    setInferredGrade(null);
    setReportId(null);
    setPersona("");
    setCareerPath([]);

    try {
      // 1. 调用 OCR 解析接口 (模拟或真实)
      const formData = new FormData();
      formData.append("file", file);

      const parseRes = await fetch("/api/transcript/parse", {
        method: "POST",
        headers: {
          "X-User-Id": "demo-user-123", // 模拟演示用户
        },
        body: formData,
      });

      if (!parseRes.ok) {
        const errorText = await parseRes.text();
        throw new Error(`解析请求失败 (状态码: ${parseRes.status})`);
      }

      const parseData = await parseRes.json();
      if (parseData.code !== 200) {
        throw new Error(parseData.message || "解析成绩单失败");
      }

      const parsedId = parseData.data.parsedId;

      // 2. 调用 AI 分析接口 (包含联网 Agent)
      const generateRes = await fetch("/api/analysis/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": "demo-user-123",
        },
        body: JSON.stringify({
          parsedId,
          major: "计算机科学与技术", // 演示写死，实际可从解析结果或用户档案提取
        }),
      });

      if (!generateRes.ok) {
        throw new Error(`生成请求失败 (状态码: ${generateRes.status})`);
      }

      const generateData = await generateRes.json();
      if (generateData.code !== 200) {
        throw new Error(generateData.message || "生成图谱失败");
      }

      // 3. 更新 UI 状态
      setParsedResult(`成功由 AI 生成能力图谱！成绩单已落库（ID: ${parsedId.slice(0, 8)}...）`);
      setRadarData(generateData.data.abilityRadar);
      setAdvice(generateData.data.optimizationAdvice);
      setDetailedGuide(generateData.data.detailedGuide); // 更新详细文档
      setInferredGrade(generateData.data.inferredGrade); // 更新年级信息
      
      // 更新个人画像和职业规划路径
      setReportId(generateData.data.reportId);
      setPersona(generateData.data.persona || "分析师未能成功提取您的个人画像特征。");
      setCareerPath(generateData.data.careerPath || []);

    } catch (error: any) {
      alert(error.message);
      setParsedResult("生成分析报告过程中发生错误。");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="flex flex-col items-center py-12 px-4">
      <div className="max-w-4xl w-full text-center mb-10">
        <h1 className="text-4xl font-extrabold text-blue-700 tracking-tight mb-4">
          巡航 (Cruise)
        </h1>
        <p className="text-lg text-gray-600 font-medium">
          基于 AI 的学生能力分析与职业规划平台
        </p>
      </div>

      {/* 模块一：成绩单上传组件 */}
      <UploadTranscript
        onUploadStart={handleUploadStart}
        isUploading={isUploading}
      />

      {/* 真实展示解析结果与雷达图 */}
      {radarData && advice && parsedResult && (
        <div className="w-full max-w-5xl mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* 左侧：雷达图 */}
          <div className="h-full flex">
            <AbilityRadarChart data={radarData} />
          </div>

          {/* 右侧：AI 分析与建议面板 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full max-h-[500px]">
            <div className="flex items-center text-green-600 mb-4 bg-green-50 px-3 py-2 rounded-lg w-fit">
              <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="font-semibold text-sm">{parsedResult}</span>
            </div>

            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-between">
              <span>个性化发展建议</span>
              {inferredGrade && (
                <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                  当前年级推断: {inferredGrade}
                </span>
              )}
            </h3>
            
            <div className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar">
              <div className="flex gap-3 items-start">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600 mt-1 flex-shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">课程修读</h4>
                  <ul className="text-gray-600 text-sm mt-1 list-disc pl-4 space-y-1">
                    {advice.course?.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="bg-purple-100 p-2 rounded-lg text-purple-600 mt-1 flex-shrink-0">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">技能提升</h4>
                  <ul className="text-gray-600 text-sm mt-1 list-disc pl-4 space-y-1">
                    {advice.skills?.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="bg-orange-100 p-2 rounded-lg text-orange-600 mt-1 flex-shrink-0">
                  <Code className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">项目实践</h4>
                  <ul className="text-gray-600 text-sm mt-1 list-disc pl-4 space-y-1">
                    {advice.projects?.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="bg-green-100 p-2 rounded-lg text-green-600 mt-1 flex-shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">实习规划</h4>
                  <ul className="text-gray-600 text-sm mt-1 list-disc pl-4 space-y-1">
                    {advice.internship?.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 模块二：可编辑的个人画像与职业生涯规划图 */}
      {reportId && (
        <EditablePersonaPath
          reportId={reportId}
          initialPersona={persona}
          initialCareerPath={careerPath}
        />
      )}

      {/* 模块三：长篇 Markdown 指导文档 */}
      {detailedGuide && (
        <div className="w-full max-w-5xl mt-6 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center border-b border-gray-100 pb-4">
            <span className="bg-blue-600 w-1.5 h-6 rounded-full mr-3"></span>
            深度职业指导文档
          </h3>
          <div className="prose prose-blue max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-h3:text-xl prose-p:text-gray-600 prose-li:text-gray-600">
            <ReactMarkdown>{detailedGuide}</ReactMarkdown>
          </div>
        </div>
      )}
    </main>
  );
}
