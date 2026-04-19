"use client";

import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import { UploadCloud, File, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

interface UploadTranscriptProps {
  onUploadStart: (file: File) => void;
  isUploading: boolean;
}

const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function UploadTranscript({
  onUploadStart,
  isUploading,
}: UploadTranscriptProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 验证文件类型和大小
  const validateFile = (file: File): boolean => {
    setErrorMsg(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMsg("仅支持 PDF、PNG 或 JPG 格式的文件");
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrorMsg("文件大小不能超过 5MB");
      return false;
    }
    return true;
  };

  // 处理拖拽事件
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  // 处理点击选择文件
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  // 触发实际的上传流程
  const handleConfirmUpload = () => {
    if (selectedFile && !isUploading) {
      onUploadStart(selectedFile);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800">上传成绩单</h2>
        <p className="text-sm text-gray-500 mt-2">支持 PDF / PNG / JPG，单文件不超过 5MB</p>
      </div>

      {/* 拖拽/点击上传区域 */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-colors cursor-pointer
          ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"}
          ${isUploading ? "opacity-60 pointer-events-none" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileSelect}
        />

        {isUploading ? (
          <>
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-700 font-medium">AI 正在深度解析并生成报告中...</p>
            <p className="text-sm text-blue-500 mt-2 font-medium">请耐心等待约 1~2 分钟，期间请勿刷新页面</p>
            <div className="w-full max-w-xs bg-gray-200 rounded-full h-1.5 mt-4 overflow-hidden">
              <div className="bg-blue-500 h-1.5 rounded-full animate-pulse w-full origin-left" style={{ animationDuration: '2s' }}></div>
            </div>
          </>
        ) : selectedFile ? (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
            <p className="text-gray-800 font-medium">{selectedFile.name}</p>
            <p className="text-xs text-gray-500 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            <p className="text-sm text-blue-500 mt-4 hover:underline">点击或拖拽以重新选择</p>
          </>
        ) : (
          <>
            <UploadCloud className={`w-12 h-12 mb-4 ${isDragging ? "text-blue-500" : "text-gray-400"}`} />
            <p className="text-gray-700 font-medium">
              将文件拖拽至此处，或 <span className="text-blue-600">点击选择文件</span>
            </p>
          </>
        )}
      </div>

      {/* 错误提示 */}
      {errorMsg && (
        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center text-sm">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* 确认上传按钮 */}
      {selectedFile && !isUploading && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleConfirmUpload}
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            开始生成能力图谱
          </button>
        </div>
      )}
    </div>
  );
}
