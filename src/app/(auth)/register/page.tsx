/**
 * 注册页面
 * 
 * 流程：
 * 1. 用户填写昵称、邮箱、密码
 * 2. POST /api/register → 服务端创建用户（密码 bcrypt 哈希）
 * 3. 注册成功后自动登录 → 跳转仪表盘
 */

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dice1 } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);

    try {
      // 第一步：POST 到注册 API
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "注册失败");
        return;
      }
      // 第二步：自动登录
      toast.success("注册成功，正在登录...");
      await signIn("credentials", {
        email: form.get("email") as string,
        password: form.get("password") as string,
        redirect: false,
      });
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("注册失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-2"><div className="rounded-full bg-primary/10 p-3"><Dice1 className="h-8 w-8 text-primary" /></div></div>
        <CardTitle className="text-2xl">创建账号</CardTitle>
        <CardDescription>加入跑团编年史，记录你的冒险</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="name">昵称</Label><Input id="name" name="name" placeholder="你的昵称" required minLength={2} /></div>
          <div className="space-y-2"><Label htmlFor="email">邮箱</Label><Input id="email" name="email" type="email" placeholder="your@email.com" required /></div>
          <div className="space-y-2"><Label htmlFor="password">密码</Label><Input id="password" name="password" type="password" placeholder="至少6位" required minLength={6} /></div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "注册中..." : "注册"}</Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">已有账号？<Link href="/login" className="text-primary hover:underline font-medium">立即登录</Link></p>
      </CardFooter>
    </Card>
  );
}