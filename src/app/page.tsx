/**
 * 首页（落地页）
 * 
 * 未登录用户看到的第一个页面，展示：
 * - 应用介绍（标题 + 三个功能卡片）
 * - 登录/注册入口
 * 
 * 已登录用户会被重定向到 /dashboard
 */

import Link from "next/link";
import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { Dice1, ScrollText, Users, Map } from "lucide-react";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  // 如果已登录，直接跳转仪表盘
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部导航（仅登录按钮） */}
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Dice1 className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">TRPG Chronicle</span>
          </Link>
          <Link href="/login" className={cn(buttonVariants())}>登录</Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero 区域 */}
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
            记录每一次<span className="text-primary">冒险</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            跑团编年史是一个专为 TRPG 玩家打造的博客平台。记录战报、管理角色、构建世界观——一切尽在一处。
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register" className={buttonVariants({ size: "lg" })}>立即开始</Link>
            <Link href="/login" className={buttonVariants({ size: "lg", variant: "outline" })}>登录</Link>
          </div>
        </section>

        {/* 功能介绍卡片 */}
        <section className="container mx-auto px-4 py-16 border-t">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: ScrollText, title: "战报记录", desc: "Markdown 撰写跑团日志，支持角色链接、骰子嵌入等自定义语法" },
              { icon: Users, title: "角色管理", desc: "通用角色卡系统，支持 D&D 5e、CoC 7th 及自定义规则" },
              { icon: Map, title: "世界观 Wiki", desc: "结构化组织地点、NPC、势力，条目间自动双向链接" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center p-6">
                <div className="rounded-full bg-primary/10 p-3 w-fit mx-auto mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">TRPG Chronicle — 为跑团而生</div>
      </footer>
    </div>
  );
}