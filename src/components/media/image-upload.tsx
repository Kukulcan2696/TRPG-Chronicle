/**
 * 图片上传组件（客户端组件）
 * 
 * 功能：
 * - 点击或拖拽上传图片到服务器
 * - 预览已上传的图片
 * - 通过回调 onUpload 将返回的 URL 传给父组件
 * 
 * 注意：在 Server Component 中使用时请用 PortraitUpload 包装组件
 * （因为 Server Component 不能直接传 onUpload 函数给客户端组件）
 * 
 * 使用方式：
 *   <ImageUpload
 *     currentUrl="/uploads/xxx.png"     // 当前已有图片（可选）
 *     onUpload={(url) => setField(url)} // 上传成功后的回调
 *   />
 */

"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  /** 当前已存在的图片 URL（用于预览） */
  currentUrl?: string | null;
  /** 上传成功后的回调，参数为服务器返回的 /uploads/xxx 路径 */
  onUpload: (url: string) => void;
  /** 上传区域的宽度，默认 200px */
  width?: number;
  /** 上传区域的高度，默认 200px */
  height?: number;
}

export function ImageUpload({
  currentUrl,
  onUpload,
  width = 200,
  height = 200,
}: ImageUploadProps) {
  // 上传中状态
  const [uploading, setUploading] = useState(false);
  // 本地预览 URL（选择文件后、上传完成前使用）
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  // 隐藏的文件选择 input 引用
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 处理文件选择事件
   * 1. 设置本地预览
   * 2. 构造 FormData 发送到 /api/upload
   * 3. 成功后调用 onUpload 回调
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 设置本地预览（在文件上传完成前先显示）
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    setUploading(true);
    try {
      // 构造 multipart/form-data 请求体
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "上传失败");
      }

      // 上传成功：通知父组件，同时更新预览为真实 URL
      onUpload(data.url);
      setPreviewUrl(data.url);
      // 释放临时 blob URL
      URL.revokeObjectURL(localPreview);
      toast.success("图片上传成功");
    } catch (error: any) {
      // 上传失败：还原预览和文件选择
      toast.error(error.message || "上传失败，请重试");
      setPreviewUrl(currentUrl || null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setUploading(false);
    }
  };

  /**
   * 清除已上传的图片
   */
  const handleClear = () => {
    setPreviewUrl(null);
    onUpload("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* ===== 预览区域 ===== */}
      <div
        className="relative border-2 border-dashed border-muted-foreground/25 rounded-lg overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
        style={{ width: `${width}px`, height: `${height}px` }}
        onClick={() => fileInputRef.current?.click()}
      >
        {previewUrl ? (
          // 有图片：显示预览
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="预览"
              className="w-full h-full object-cover"
            />
            {/* 上传中遮罩 */}
            {uploading && (
              <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </>
        ) : (
          // 无图片：显示上传提示
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <Upload className="h-8 w-8 mb-1" />
            <span className="text-xs">
              {uploading ? "上传中..." : "点击上传"}
            </span>
          </div>
        )}
      </div>

      {/* ===== 隐藏的文件选择 input ===== */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />

      {/* ===== 清除按钮（有图片时显示） ===== */}
      {previewUrl && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleClear();
          }}
          disabled={uploading}
        >
          <X className="h-3 w-3 mr-1" />
          移除图片
        </Button>
      )}
    </div>
  );
}