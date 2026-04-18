"use client";

import React, { useState } from "react";
import { Edit2, Check, User, Map } from "lucide-react";
import { useUserId } from "@/lib/useUserId";

interface CareerPathItem {
  phase: string;
  milestone: string;
  detail: string;
}

interface EditablePersonaPathProps {
  reportId: string;
  initialPersona: string;
  initialCareerPath: CareerPathItem[];
}

export default function EditablePersonaPath({
  reportId,
  initialPersona,
  initialCareerPath,
}: EditablePersonaPathProps) {
  const userId = useUserId();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [persona, setPersona] = useState(initialPersona);
  const [careerPath, setCareerPath] = useState<CareerPathItem[]>(initialCareerPath);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/analysis/report/${reportId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": userId,
        },
        body: JSON.stringify({ persona, careerPath }),
      });

      if (!res.ok) throw new Error("保存失败");
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      alert("保存失败，请稍后再试");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePathChange = (index: number, field: keyof CareerPathItem, value: string) => {
    const newPath = [...careerPath];
    newPath[index] = { ...newPath[index], [field]: value };
    setCareerPath(newPath);
  };

  const addPathNode = () => {
    setCareerPath([...careerPath, { phase: "新阶段", milestone: "新目标", detail: "执行细节..." }]);
  };

  const removePathNode = (index: number) => {
    const newPath = [...careerPath];
    newPath.splice(index, 1);
    setCareerPath(newPath);
  };

  return (
    <div className="w-full max-w-5xl mt-6 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <User className="w-6 h-6 text-blue-600" />
          AI 个人画像与职业规划
        </h3>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            自定义编辑
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Check className="w-4 h-4" />
            {isSaving ? "保存中..." : "完成编辑"}
          </button>
        )}
      </div>

      {/* 个人画像部分 */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-700 mb-3 border-l-4 border-blue-500 pl-3">个人画像</h4>
        {isEditing ? (
          <textarea
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            className="w-full p-4 bg-gray-50 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none min-h-[100px] text-gray-700"
            placeholder="描述你的个人技术特征..."
          />
        ) : (
          <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-xl text-gray-700 leading-relaxed">
            {persona || "AI 暂未生成画像，你可以点击编辑自行添加。"}
          </div>
        )}
      </div>

      {/* 职业路径图部分 */}
      <div>
        <h4 className="text-lg font-semibold text-gray-700 mb-4 border-l-4 border-orange-500 pl-3 flex items-center gap-2">
          <Map className="w-5 h-5 text-orange-500" />
          生涯规划路径图
        </h4>
        
        <div className="relative border-l-2 border-orange-200 ml-3 space-y-8 pl-6 pb-4">
          {careerPath.map((item, index) => (
            <div key={index} className="relative">
              <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white border-4 border-orange-500 shadow-sm" />
              
              {isEditing ? (
                <div className="bg-gray-50 p-4 rounded-xl border border-orange-200 space-y-3 relative group">
                  <button 
                    onClick={() => removePathNode(index)}
                    className="absolute top-3 right-3 text-red-400 hover:text-red-600 text-sm font-medium"
                  >
                    删除
                  </button>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={item.phase}
                      onChange={(e) => handlePathChange(index, "phase", e.target.value)}
                      className="font-bold text-orange-700 bg-white border border-gray-200 px-3 py-1.5 rounded-lg outline-none w-1/3 focus:border-orange-400"
                      placeholder="阶段 (如: 大三下学期)"
                    />
                    <input
                      type="text"
                      value={item.milestone}
                      onChange={(e) => handlePathChange(index, "milestone", e.target.value)}
                      className="font-bold text-gray-800 bg-white border border-gray-200 px-3 py-1.5 rounded-lg outline-none flex-1 focus:border-orange-400"
                      placeholder="核心目标里程碑"
                    />
                  </div>
                  <textarea
                    value={item.detail}
                    onChange={(e) => handlePathChange(index, "detail", e.target.value)}
                    className="w-full p-3 bg-white border border-gray-200 rounded-lg outline-none text-sm text-gray-600 resize-none focus:border-orange-400"
                    placeholder="具体的执行细节与规划..."
                    rows={2}
                  />
                </div>
              ) : (
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                      {item.phase}
                    </span>
                    <h5 className="font-bold text-gray-900 text-lg">{item.milestone}</h5>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mt-2">{item.detail}</p>
                </div>
              )}
            </div>
          ))}
          
          {isEditing && (
            <button
              onClick={addPathNode}
              className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-orange-600 hover:border-orange-300 transition-colors font-medium text-sm flex justify-center items-center gap-2"
            >
              + 添加新的阶段节点
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
