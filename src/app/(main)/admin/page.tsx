/**
 * 管理后台页面
 * 
 * 仅 ADMIN 角色用户可访问。
 * 功能：
 * - 系统统计概览
 * - 用户管理（查看、修改角色）
 * - 战役管理（查看、删除）
 */

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, Users, BookOpen, ScrollText, Dices, Trash2 } from "lucide-react";
import { AdminUserActions } from "./user-actions";
import { AdminDeleteCampaign } from "./campaign-actions";

export default async function AdminPage() {
  const session = await auth();

  // ===== 权限校验 =====
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/dashboard");
  }

  // ===== 统计数据 =====
  const [userCount, campaignCount, postCount, characterCount, diceCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.campaign.count(),
      prisma.post.count(),
      prisma.character.count(),
      prisma.diceRoll.count(),
    ]);

  // ===== 用户列表 =====
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { campaigns: true, posts: true, characters: true } },
    },
  });

  // ===== 战役列表 =====
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      dm: { select: { id: true, name: true } },
      _count: { select: { members: true, posts: true, characters: true } },
    },
  });

  return (
    <div className="space-y-6">
      {/* ===== 标题 ===== */}
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">管理后台</h1>
          <p className="text-sm text-muted-foreground">系统管理与用户维护</p>
        </div>
      </div>

      {/* ===== 统计概览 ===== */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
        {[
          { label: "用户", icon: Users, val: userCount },
          { label: "战役", icon: BookOpen, val: campaignCount },
          { label: "战报", icon: ScrollText, val: postCount },
          { label: "角色", icon: Users, val: characterCount },
          { label: "掷骰", icon: Dices, val: diceCount },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{s.val}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      {/* ===== 用户列表 ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">用户列表（最近 20 位）</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-2 font-medium text-xs">用户名</th>
                  <th className="text-left px-4 py-2 font-medium text-xs">邮箱</th>
                  <th className="text-left px-4 py-2 font-medium text-xs">角色</th>
                  <th className="text-left px-4 py-2 font-medium text-xs hidden sm:table-cell">注册时间</th>
                  <th className="text-right px-4 py-2 font-medium text-xs hidden sm:table-cell">数据</th>
                  <th className="text-right px-4 py-2 font-medium text-xs">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-2 font-medium">{u.name || "未命名"}</td>
                    <td className="px-4 py-2 text-muted-foreground text-xs">{u.email}</td>
                    <td className="px-4 py-2">
                      <Badge
                        variant={u.role === "ADMIN" ? "default" : u.role === "DM" ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {u.role === "ADMIN" ? "管理员" : u.role === "DM" ? "DM" : "玩家"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground hidden sm:table-cell">
                      {new Date(u.createdAt).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground text-right hidden sm:table-cell">
                      {u._count.campaigns}战役 {u._count.posts}战报 {u._count.characters}角色
                    </td>
                    <td className="px-4 py-2 text-right">
                      <AdminUserActions userId={u.id} userName={u.name || "未命名"} currentRole={u.role} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ===== 战役列表 ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">战役列表（最近 20 个）</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-2 font-medium text-xs">战役名</th>
                  <th className="text-left px-4 py-2 font-medium text-xs">DM</th>
                  <th className="text-left px-4 py-2 font-medium text-xs">Slug</th>
                  <th className="text-right px-4 py-2 font-medium text-xs hidden sm:table-cell">统计</th>
                  <th className="text-right px-4 py-2 font-medium text-xs">操作</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-2 font-medium">
                      <Link href={`/campaigns/${c.slug}`} className="hover:text-primary transition-colors">
                        {c.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{c.dm.name}</td>
                    <td className="px-4 py-2 text-xs font-mono text-muted-foreground">{c.slug}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground text-right hidden sm:table-cell">
                      {c._count.members}成员 {c._count.posts}战报 {c._count.characters}角色
                    </td>
                    <td className="px-4 py-2 text-right">
                      <AdminDeleteCampaign campaignId={c.id} campaignTitle={c.title} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}