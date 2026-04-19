"use client";

import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export interface RadarData {
  coreSkills: number;
  mathOrLogic: number;
  analysis: number;
  communication: number;
  teamwork: number;
}

interface AbilityRadarChartProps {
  data: RadarData;
}

const DIMENSION_MAP: Record<keyof RadarData, string> = {
  coreSkills: "核心专业能力",
  mathOrLogic: "逻辑/数理基础",
  analysis: "问题分析解决",
  communication: "沟通表达撰写",
  teamwork: "团队协作领导",
};

export default function AbilityRadarChart({ data }: AbilityRadarChartProps) {
  // 转换数据格式以适配 recharts
  const chartData = Object.entries(data).map(([key, value]) => ({
    subject: DIMENSION_MAP[key as keyof RadarData],
    A: value,
    fullMark: 100,
  }));

  return (
    <div className="w-full h-80 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col">
      <h3 className="text-lg font-bold text-gray-800 text-center mb-2">
        五维能力评估模型
      </h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "#4b5563", fontSize: 14, fontWeight: 500 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: "#9ca3af", fontSize: 12 }}
            />
            <Radar
              name="能力评估值"
              dataKey="A"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="#3b82f6"
              fillOpacity={0.4}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
