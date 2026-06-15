/**
 * 登录页面
 * 
 * 两种登录方式：
 * 1. OAuth（GitHub / Google）→ 跳转第三方授权
 * 2. 邮箱 + 密码 → 走 NextAuth Credentials provider
 * 
 * signIn("credentials", { redirect: false })
 *   redirect: false 表示不自动跳转，我们手动 router.push
 *   这样可以在登录失败时显示错误提示
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
import { Separator } from "@/components/ui/separator";
import { Dice1 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // signIn 返回 { error: string | null, ok: boolean }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        toast.error("登录失败，请检查邮箱和密码");
      } else {
        router.push("/dashboard");
        router.refresh(); // 刷新服务端组件以获取最新 session
      }
    } catch {
      toast.error("登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-2">
          <div className="rounded-full bg-primary/10 p-3"><Dice1 className="h-8 w-8 text-primary" /></div>
        </div>
        <CardTitle className="text-2xl">欢迎回来</CardTitle>
        <CardDescription>登录你的跑团编年史账号</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* OAuth 按钮 */}
        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" onClick={() => signIn("github", { callbackUrl: "/dashboard" })}>GitHub</Button>
          <Button variant="outline" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>Google</Button>
        </div>
        <div className="relative">
          <div className="absolute inset-0 flex items-center"><Separator /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">或使用邮箱登录</span></div>
        </div>
        {/* 邮箱登录表单 */}
        <form onSubmit={handleCredentials} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="email">邮箱</Label><Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="password">密码</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "登录中..." : "登录"}</Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">还没有账号？<Link href="/register" className="text-primary hover:underline font-medium">立即注册</Link></p>
      </CardFooter>
    </Card>
  );
}