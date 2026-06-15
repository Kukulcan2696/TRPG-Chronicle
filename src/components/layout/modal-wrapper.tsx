/**
 * 弹窗布局组件
 * 
 * 在战役子页面上叠加一个居中的卡片式弹窗，
 * 背景半透明遮罩，点击遮罩可返回（通过关闭按钮实现）。
 * 
 * 用法：在 layout.tsx 中包裹 children
 * <ModalLayout campaignSlug="xxx" title="战报">
 *   {children}
 * </ModalLayout>
 */
import Link from "next/link";
import { X } from "lucide-react";

export function ModalWrapper({
  campaignSlug,
  children,
}: {
  campaignSlug: string;
  children: React.ReactNode;
}) {
  return (
    <>
      {/* 半透明遮罩背景 */}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" />
      
      {/* 居中弹窗卡片 */}
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh] overflow-auto">
        <div className="relative w-full max-w-5xl bg-card rounded-xl border shadow-2xl">
          {/* 关闭按钮 - 返回战役概览 */}
          <Link
            href={`/campaigns/${campaignSlug}`}
            className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-muted transition-colors z-10"
          >
            <X className="h-4 w-4" />
          </Link>
          
          {/* 内容区 */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}