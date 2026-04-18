"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, LineChart, Briefcase, Mic } from "lucide-react";
import UserProfileModal from "./UserProfileModal";

export default function Navbar() {
  const pathname = usePathname();
  const [showProfile, setShowProfile] = useState(false);

  const navItems = [
    { href: "/", label: "成绩单分析", icon: LineChart },
    { href: "/career", label: "职业探索", icon: Briefcase },
    { href: "/interview", label: "AI 模拟面试", icon: Mic },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-blue-600 p-1.5 rounded-lg group-hover:bg-blue-700 transition-colors">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-gray-900 group-hover:text-blue-600 transition-colors">
              Cruise <span className="font-medium text-gray-500 text-sm ml-1 hidden sm:inline-block">巡航</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1 sm:gap-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                  <span className="hidden sm:block">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Profile Mock */}
          <div className="flex items-center relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowProfile(true);
              }}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-sm hover:shadow-md hover:scale-105 transition-all"
            >
              U
            </button>
          </div>
        </div>
      </div>

      {showProfile && (
        <div 
          className="fixed inset-0 z-50"
          onClick={() => setShowProfile(false)}
        >
          <UserProfileModal onClose={() => setShowProfile(false)} />
        </div>
      )}
    </nav>
  );
}
