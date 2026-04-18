"use client";

import React, { useState } from "react";
import { Search, MapPin, Building, ChevronRight } from "lucide-react";

interface Role {
  roleId: string;
  roleName: string;
  alumniCount: number;
}

interface Company {
  companyId: string;
  companyName: string;
  roles: Role[];
}

interface CareerSearchBarProps {
  onSearch: (keyword: string) => void;
  isLoading: boolean;
}

export default function CareerSearchBar({ onSearch, isLoading }: CareerSearchBarProps) {
  const [keyword, setKeyword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      onSearch(keyword.trim());
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-12 pr-32 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="搜索公司或岗位，例如：字节跳动 后端开发..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button
          type="submit"
          disabled={isLoading || !keyword.trim()}
          className="absolute inset-y-2 right-2 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "搜索中..." : "探索岗位"}
        </button>
      </form>

      {/* 快捷搜索标签 */}
      <div className="mt-4 flex flex-wrap items-center gap-2 justify-center text-sm">
        <span className="text-gray-500">大家都在搜:</span>
        {["字节跳动", "产品经理", "前端开发", "腾讯", "算法工程师"].map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => {
              setKeyword(tag);
              onSearch(tag);
            }}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
