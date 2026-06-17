/**
 * 个人设置页面
 * 
 * 功能：
 * - 查看/编辑用户名
 * - 上传/更换头像
 * - 修改密码（可选）
 * 
 * 安全：
 * - 需要登录才能访问（中间件保护）
 * - 密码修改需要验证当前密码
 */

import { auth } from "@/auth";
import Link from "next/link";
import { updateProfile, bindQQ, unbindQQ } from "./actions";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PortraitUpload } from "@/components/media/portrait-upload";
import { ArrowLeft, User, Mail, Shield, Link as LinkIcon, Unlink } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();

  // 获取用户完整信息
  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    select: {
      id: true, name: true, email: true, image: true, role: true, createdAt: true,
      botBindings: { where: { platform: "qq" }, select: { platformId: true } },
    },
  });

  const qqBinding = user?.botBindings?.[0]?.platformId ?? null;

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold">用户不存在</h1>
        <Link href="/dashboard" className="text-primary hover:underline mt-2 inline-block">
          返回仪表盘
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      {/* 返回链接 */}
      <Link
        href="/dashboard"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        返回仪表盘
      </Link>

      <div>
        <h1 className="text-2xl font-bold">个人设置</h1>
        <p className="text-muted-foreground">管理你的账号信息</p>
      </div>

      {/* ===== 基本信息卡片 ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            基本信息
          </CardTitle>
          <CardDescription>
            注册于 {new Date(user.createdAt).toLocaleDateString("zh-CN")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateProfile} className="space-y-4">
            {/* 头像 */}
            <div className="space-y-2">
              <Label>头像</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.image || ""} />
                  <AvatarFallback className="text-xl">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <PortraitUpload name="image" currentUrl={user.image} width={100} height={100} />
              </div>
            </div>

            {/* 用户名 */}
            <div className="space-y-2">
              <Label htmlFor="name">用户名</Label>
              <Input id="name" name="name" defaultValue={user.name || ""} />
            </div>

            {/* 邮箱（只读） */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                邮箱
              </Label>
              <Input value={user.email} disabled className="opacity-60" />
              <p className="text-xs text-muted-foreground">邮箱暂时不支持修改</p>
            </div>

            {/* 角色（只读） */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Shield className="h-3.5 w-3.5" />
                角色
              </Label>
              <Input value={user.role === "ADMIN" ? "管理员" : "用户"} disabled className="opacity-60" />
            </div>

            <Button type="submit">保存修改</Button>
          </form>
        </CardContent>
      </Card>

      {/* ===== QQ 绑定卡片 ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            QQ 绑定
          </CardTitle>
          <CardDescription>
            {qqBinding
              ? `已绑定 QQ: ${qqBinding}`
              : "绑定 QQ 号后，机器人在群内可识别你的身份"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {qqBinding ? (
            <form action={unbindQQ} className="flex items-center gap-3">
              <input type="hidden" name="qqNumber" value={qqBinding} />
              <Input value={qqBinding} disabled className="flex-1 opacity-60" />
              <Button type="submit" variant="destructive" size="sm">
                <Unlink className="h-4 w-4 mr-1" />
                解绑
              </Button>
            </form>
          ) : (
            <form action={bindQQ} className="flex items-center gap-3">
              <Input
                name="qqNumber"
                placeholder="输入 QQ 号"
                className="flex-1"
                pattern="\d{5,15}"
                required
              />
              <Button type="submit" size="sm">
                <LinkIcon className="h-4 w-4 mr-1" />
                绑定
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* ===== 修改密码卡片 ===== */}
      {user.email && (
        <Card>
          <CardHeader>
            <CardTitle>修改密码</CardTitle>
            <CardDescription>输入当前密码和新密码</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">当前密码</Label>
                <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">新密码</Label>
                <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" placeholder="留空表示不修改" />
              </div>
              <Button type="submit" variant="outline">修改密码</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}