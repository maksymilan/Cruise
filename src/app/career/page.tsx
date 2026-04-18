"use client";

import React, { useState } from "react";
import CareerSearchBar from "@/components/CareerSearchBar";
import CareerDetailCard from "@/components/CareerDetailCard";
import RoleDetailModal from "@/components/RoleDetailModal";
import { Loader2 } from "lucide-react";

export default function CareerPage() {
  const [isSearching, setIsSearching] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  const handleSearch = async (keyword: string) => {
    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/careers/search?keyword=${encodeURIComponent(keyword)}&page=1&pageSize=10`);
      const data = await res.json();
      if (data.code === 200) {
        setCompanies(data.data.list);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRoleClick = (role: any) => {
    setSelectedRoleId(role.roleId);
  };

  return (
    <main className="py-12 px-4 flex flex-col items-center">
      <div className="max-w-4xl w-full text-center mb-10">
        <h1 className="text-4xl font-extrabold text-blue-700 tracking-tight mb-4">
          岗位图谱与校友热度
        </h1>
        <p className="text-lg text-gray-600 font-medium">
          探索海量真实校友去向，对比个人能力与岗位需求
        </p>
      </div>

      <CareerSearchBar onSearch={handleSearch} isLoading={isSearching} />

      {/* 搜索结果区 */}
      <div className="w-full max-w-4xl mt-12 space-y-6">
        {isSearching ? (
          <div className="flex justify-center items-center py-20 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mr-3 text-blue-500" /> 正在从全网校友库检索中...
          </div>
        ) : hasSearched && companies.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            未找到相关公司或岗位，请换个关键词试试
          </div>
        ) : (
          companies.map((company) => (
            <div key={company.companyId} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CareerDetailCard company={company} onRoleClick={handleRoleClick} />
            </div>
          ))
        )}
      </div>

      {/* 岗位详情与能力对比弹窗 */}
      {selectedRoleId && (
        <RoleDetailModal 
          roleId={selectedRoleId} 
          onClose={() => setSelectedRoleId(null)} 
        />
      )}
    </main>
  );
}
