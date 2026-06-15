/**
 * 根布局（所有页面的外层容器）
 * 
 * 包裹内容：
 * - SessionProvider: 让客户端组件能用 useSession() 获取用户信息
 * - ThemeProvider: 暗色模式切换（next-themes）
 * - Toaster: 全局 toast 通知（sonner）
 * 
 * suppressHydrationWarning: 避免 next-themes 在服务端/客户端
 * 渲染不一致时的警告
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TRPG Chronicle - 跑团编年史",
  description: "桌游跑团辅助博客，记录你的冒险故事",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-screen bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <SessionProvider>{children}</SessionProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}