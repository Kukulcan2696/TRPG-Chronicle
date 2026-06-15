/**
 * 加入战役页面
 * 
 * 通过邀请码加入战役。
 * URL 格式：/join?code=XXXXXXXX
 * 
 * 流程：
 * 1. 读取 query 参数中的邀请码
 * 2. 已登录 → 显示"确认加入"按钮（点击后调用 Server Action）
 * 3. 未登录 → 显示登录提示
 * 4. 加入成功后跳转到战役概览页
 */

import { auth } from "@/auth";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, LogIn } from "lucide-react";
import { JoinButton } from "./join-button";

interface PageProps {
  searchParams: Promise<{ code?: string }>;
}

export default async function JoinPage({ searchParams }: PageProps) {
  const session = await auth();
  const { code } = await searchParams;

  // 未登录 → 显示登录提示
  if (!session?.user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <CardTitle>加入战役</CardTitle>
            <CardDescription>你需要先登录才能加入战役</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href={`/login?callbackUrl=/join${code ? `?code=${code}` : ""}`} className={buttonVariants({ className: "w-full" })}>
              <LogIn className="mr-2 h-4 w-4" />
              登录
            </Link>
            <Link href="/register" className={buttonVariants({ variant: "outline", className: "w-full" })}>
              注册新账号
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 已登录但没有邀请码
  if (!code) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>无效链接</CardTitle>
            <CardDescription>邀请链接缺少邀请码，请向 DM 索取正确的邀请链接。</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
              返回仪表盘
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 已登录 + 有邀请码 → 显示确认加入按钮（客户端组件处理 Server Action）
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <CardTitle>加入战役</CardTitle>
          <CardDescription>
            点击下方按钮加入战役，加入后会自动跳转到战役页面。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JoinButton code={code} />
        </CardContent>
      </Card>
    </div>
  );
}