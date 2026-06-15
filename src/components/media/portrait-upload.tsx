/**
 * 头像上传包装组件（客户端组件）
 * 
 * 解决 Server Component 不能直接传 onUpload 回调给 ImageUpload 的问题。
 * 此组件封装了 ImageUpload + 隐藏 input，Server Component 只需传 name 和 currentUrl。
 * 
 * 隐藏 input 的值会被包含在父级 <form> 的 FormData 中一起提交。
 */

"use client";

import { ImageUpload } from "@/components/media/image-upload";

interface PortraitUploadProps {
  /** 隐藏 input 的 name 属性（对应 Server Action 中的字段名） */
  name: string;
  /** 当前已有的图片 URL（编辑时传入） */
  currentUrl?: string | null;
  /** 上传区域宽度 */
  width?: number;
  /** 上传区域高度 */
  height?: number;
}

export function PortraitUpload({
  name,
  currentUrl,
  width = 200,
  height = 200,
}: PortraitUploadProps) {
  return (
    <>
      <ImageUpload
        currentUrl={currentUrl}
        onUpload={(url) => {
          // 更新隐藏 input 的值
          const hiddenInput = document.getElementById(`${name}-input`) as HTMLInputElement;
          if (hiddenInput) hiddenInput.value = url;
        }}
        width={width}
        height={height}
      />
      {/* 隐藏 input 随表单一起提交到 Server Action */}
      <input type="hidden" id={`${name}-input`} name={name} value={currentUrl || ""} />
    </>
  );
}