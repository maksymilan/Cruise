"use client";

import React, { useState, useEffect } from "react";
import { X, Briefcase, ChevronRight, GraduationCap, Play } from "lucide-react";
import AbilityRadarChart, { RadarData } from "@/components/AbilityRadarChart";
import { useRouter } from "next/navigation";
import { useUserId } from "@/lib/useUserId";

interface RoleDetailModalProps {
  roleId: string;
  onClose: () => void;
}

export default function RoleDetailModal({ roleId, onClose }: RoleDetailModalProps) {
  const router = useRouter();
  const userId = useUserId();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // 确保 userId 有效时再请求
    if (!userId || userId === "demo-user-123") return;
    
    const fetchDetails = async () => {
      try {
        const res = await fetch(`/api/careers/${roleId}/details`, {
          headers: { "X-User-Id": userId },
          cache: "no-store",
        });
        const json = await res.json();
        if (json.code === 200) {
          setData(json.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [roleId, userId]);

  if (!roleId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            岗位能力要求分析
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-gray-500">加载中...</div>
          ) : !data ? (
            <div className="h-64 flex items-center justify-center text-red-500">加载失败</div>
          ) : (
            <div className="space-y-8">
              {/* JD Section */}
              <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{data.roleInfo.roleName}</h3>
                    <p className="text-gray-500 mt-1">{data.roleInfo.companyName}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-orange-600">{data.roleInfo.salaryRange}</span>
                  </div>
                </div>
                <div className="text-gray-700 text-sm leading-relaxed mb-4">
                  <p className="font-semibold mb-1">岗位职责：</p>
                  {data.roleInfo.description}
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                    前景: {data.roleInfo.prospects}
                  </span>
                </div>
              </div>

              {/* Radar Comparison Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-800 border-l-4 border-blue-500 pl-3">能力雷达对比</h4>
                  <div className="bg-gray-50 rounded-2xl border border-gray-100 h-80 relative">
                    {/* 层叠展示两个雷达图 */}
                    <div className="absolute inset-0 z-0">
                      <AbilityRadarChart data={data.requiredRadar} />
                    </div>
                    {data.userRadar ? (
                      <div className="absolute inset-0 z-10 mix-blend-multiply">
                        <AbilityRadarChart data={data.userRadar} />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-20 rounded-2xl">
                        <p className="text-gray-500 text-sm">你还未生成个人图谱，无法对比</p>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-center gap-6 text-sm text-gray-600">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-500 opacity-80"></span> 我的能力 (乘底混合)
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-500 opacity-30"></span> 岗位基线
                    </span>
                  </div>
                </div>

                {/* Gap Analysis Section */}
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-800 border-l-4 border-green-500 pl-3">差距分析与学习路径</h4>
                  {data.gapAnalysis ? (
                    <div className="space-y-4">
                      <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                        <p className="text-green-800 font-semibold text-sm mb-2">优势维度</p>
                        <div className="flex gap-2 flex-wrap">
                          {data.gapAnalysis.strengths.length > 0 
                            ? data.gapAnalysis.strengths.map((s: string) => (
                                <span key={s} className="px-2 py-1 bg-white text-green-700 text-xs rounded border border-green-200 shadow-sm">{s}</span>
                              ))
                            : <span className="text-sm text-green-600">暂无明显优势</span>
                          }
                        </div>
                      </div>
                      
                      <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                        <p className="text-red-800 font-semibold text-sm mb-2">待提升维度</p>
                        <div className="flex gap-2 flex-wrap">
                          {data.gapAnalysis.weaknesses.length > 0 
                            ? data.gapAnalysis.weaknesses.map((w: string) => (
                                <span key={w} className="px-2 py-1 bg-white text-red-700 text-xs rounded border border-red-200 shadow-sm">{w}</span>
                              ))
                            : <span className="text-sm text-red-600">非常匹配！没有明显短板</span>
                          }
                        </div>
                      </div>

                      <div className="mt-6 border-t border-gray-100 pt-6">
                        <p className="text-gray-800 font-semibold mb-4">推荐学习路径</p>
                        {data.gapAnalysis.learningPath.map((path: any, i: number) => (
                          <div key={i} className="flex gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                              {i + 1}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 text-sm">{path.title}</p>
                              <p className="text-gray-500 text-xs mt-1">{path.action}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-100 h-full flex flex-col justify-center items-center">
                      <GraduationCap className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-gray-600 font-medium">请先去上传成绩单生成能力图谱</p>
                      <button 
                        onClick={() => {
                          onClose();
                          router.push("/");
                        }}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                      >
                        去生成图谱
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer Action */}
        {data && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
            <button 
              onClick={() => {
                onClose();
                // 由于目前的路由结构，AI模拟面试在 /interview 路由下
                // 我们通过 URL query 参数把岗位名称传递过去
                router.push(`/interview?role=${encodeURIComponent(data.roleInfo.roleName)}`);
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-colors shadow-sm"
            >
              <Play className="w-4 h-4" />
              发起该岗位的 AI 模拟面试
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
