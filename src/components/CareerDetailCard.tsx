"use client";

import React from "react";
import { Users, Briefcase, Landmark, ExternalLink, GraduationCap, MapPin, Building, ChevronRight } from "lucide-react";

interface Role {
  roleId: string;
  roleName: string;
  alumniCount: number;
}

interface Company {
  companyId: string;
  companyName: string;
  companyUrl?: string;
  roles: Role[];
}

interface CareerDetailCardProps {
  company: Company;
  onRoleClick: (role: Role) => void;
}

export default function CareerDetailCard({ company, onRoleClick }: CareerDetailCardProps) {
  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      {/* 公司头部信息 */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">{company.companyName}</h3>
            <div className="flex items-center text-sm text-gray-500 mt-1 gap-3">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> 互联网 / 科技
              </span>
              <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                <Users className="w-3.5 h-3.5" /> 校友热度高
              </span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => {
            if (company.companyUrl) {
              window.open(company.companyUrl, "_blank");
            } else {
              alert(`未找到 ${company.companyName} 的招聘官网链接`);
            }
          }}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          查看公司主页 <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {/* 岗位列表 */}
      <div>
        <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">
          相关岗位 ({company.roles.length})
        </h4>
        <div className="space-y-3">
          {company.roles.map((role) => (
            <div
              key={role.roleId}
              onClick={() => onRoleClick(role)}
              className="group flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-2 rounded-lg text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                    {role.roleName}
                  </h5>
                  <div className="flex items-center text-xs text-gray-500 mt-1 gap-2">
                    <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                      <GraduationCap className="w-3 h-3" />
                      已有 {role.alumniCount} 位校友就职
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
