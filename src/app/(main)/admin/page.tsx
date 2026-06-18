/**
 * 管理后台页面
 *
 * 仅 ADMIN 角色可访问。
 * 分标签页：概览 / 用户管理 / 战役管理
 */

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Shield, Users, BookOpen, ScrollText, Dices, Key,
  Calendar, Search, ChevronLeft, ChevronRight,
} from "lucide-react";
import { AdminUserActions } from "./user-actions";
import { AdminDeleteCampaign } from "./campaign-actions";
import { CampaignEditButton } from "./campaign-edit-button";
import { AdminTabNav } from "./tab-nav";
import { DiceTab } from "./dice-tab";
import { CharactersTab } from "./characters-tab";
import { PostsTab } from "./posts-tab";
import { BindingsTab } from "./bindings-tab";
import { AuditLogTab } from "./audit-log-tab";

const PAGE_SIZE = 15;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string; q?: string; action?: string }>;
}) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/dashboard");
  }

  const sp = await searchParams;
  const tab = sp.tab || "overview";
  const page = Math.max(1, parseInt(sp.page || "1"));
  const query = sp.q || "";

  return (
    <div className="space-y-6">
      {/* ===== 标题 ===== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">管理后台</h1>
            <p className="text-sm text-muted-foreground">系统管理与用户维护</p>
          </div>
        </div>
        <Link
          href="/admin/api-keys"
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
        >
          <Key className="h-4 w-4" /> API 密钥
        </Link>
      </div>

      {/* ===== 标签导航 ===== */}
      <AdminTabNav current={tab} />
      <Separator />

      {/* ===== 概览标签页 ===== */}
      {tab === "overview" && <OverviewTab />}

      {/* ===== 用户管理标签页 ===== */}
      {tab === "users" && <UsersTab page={page} query={query} />}

      {/* ===== 战役管理标签页 ===== */}
      {tab === "campaigns" && <CampaignsTab page={page} query={query} />}

      {/* ===== 掷骰记录标签页 ===== */}
      {tab === "dice" && <DiceTab page={page} query={query} />}

      {/* ===== 角色管理标签页 ===== */}
      {tab === "characters" && <CharactersTab page={page} query={query} />}

      {/* ===== 战报管理标签页 ===== */}
      {tab === "posts" && <PostsTab page={page} query={query} />}

      {/* ===== 绑定管理标签页 ===== */}
      {tab === "bindings" && <BindingsTab page={page} query={query} />}

      {/* ===== 操作日志标签页 ===== */}
      {tab === "audit" && (
        <AuditLogTab
          page={page}
          action={sp.action}
          q={query}
        />
      )}
    </div>
  );
}

/* ================================================================
 *  概览标签页
 * ================================================================ */

async function OverviewTab() {
  const [userCount, adminCount, campaignCount, postCount, characterCount,
    diceCount, wikiCount, scheduleCount, tableCount,
    recentUsers, recentPosts, recentCampaigns,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.campaign.count(),
    prisma.post.count(),
    prisma.character.count(),
    prisma.diceRoll.count(),
    prisma.worldEntry.count(),
    prisma.scheduleEvent.count({ where: { scheduledAt: { gte: new Date() } } }),
    prisma.randomTable.count(),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, name: true, email: true, role: true, createdAt: true } }),
    prisma.post.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, title: true, createdAt: true, campaign: { select: { slug: true, title: true } }, author: { select: { name: true } } } }),
    prisma.campaign.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, title: true, slug: true, createdAt: true, dm: { select: { name: true } }, _count: { select: { members: true, posts: true } } } }),
  ]);

  const stats = [
    { label: "用户", sub: `${adminCount} 管理员`, icon: Users, val: userCount },
    { label: "战役", icon: BookOpen, val: campaignCount },
    { label: "战报", icon: ScrollText, val: postCount },
    { label: "角色卡", icon: Users, val: characterCount },
    { label: "掷骰记录", icon: Dices, val: diceCount },
    { label: "百科条目", icon: BookOpen, val: wikiCount },
    { label: "即将排期", icon: Calendar, val: scheduleCount },
    { label: "随机表", icon: Dices, val: tableCount },
  ];

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-2xl font-bold">{s.val}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                {"sub" in s && <p className="text-[10px] text-muted-foreground">{s.sub as string}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 最近动态 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 最近注册用户 */}
        <Card>
          <CardHeader><CardTitle className="text-base">最近注册用户</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-2 font-medium text-xs">用户</th>
                  <th className="text-left px-4 py-2 font-medium text-xs hidden sm:table-cell">邮箱</th>
                  <th className="text-right px-4 py-2 font-medium text-xs">角色</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-2 font-medium text-xs">{u.name || "—"}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground hidden sm:table-cell">{u.email}</td>
                    <td className="px-4 py-2 text-right">
                      <Badge variant={u.role === "ADMIN" ? "default" : "outline"} className="text-[10px]">
                        {u.role === "ADMIN" ? "管理员" : "用户"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* 最近战报 */}
        <Card>
          <CardHeader><CardTitle className="text-base">最近战报</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-2 font-medium text-xs">标题</th>
                  <th className="text-left px-4 py-2 font-medium text-xs hidden sm:table-cell">战役</th>
                  <th className="text-right px-4 py-2 font-medium text-xs hidden sm:table-cell">作者</th>
                </tr>
              </thead>
              <tbody>
                {recentPosts.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-2 text-xs font-medium">
                      <Link href={`/campaigns/${p.campaign.slug}/posts`} className="hover:text-primary">
                        {p.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground hidden sm:table-cell">{p.campaign.title}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground text-right hidden sm:table-cell">{p.author?.name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* 最近战役 */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">最近创建的战役</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-2 font-medium text-xs">战役</th>
                  <th className="text-left px-4 py-2 font-medium text-xs">DM</th>
                  <th className="text-right px-4 py-2 font-medium text-xs hidden sm:table-cell">成员</th>
                  <th className="text-right px-4 py-2 font-medium text-xs hidden sm:table-cell">战报</th>
                  <th className="text-right px-4 py-2 font-medium text-xs">创建时间</th>
                </tr>
              </thead>
              <tbody>
                {recentCampaigns.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-2 text-xs font-medium">
                      <Link href={`/campaigns/${c.slug}`} className="hover:text-primary">{c.title}</Link>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{c.dm.name}</td>
                    <td className="px-4 py-2 text-xs text-right hidden sm:table-cell">{c._count.members}</td>
                    <td className="px-4 py-2 text-xs text-right hidden sm:table-cell">{c._count.posts}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground text-right">
                      {new Date(c.createdAt).toLocaleDateString("zh-CN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ================================================================
 *  用户管理标签页
 * ================================================================ */

async function UsersTab({ page, query }: { page: number; query: string }) {
  const where: any = {};
  if (query) {
    where.OR = [
      { name: { contains: query } },
      { email: { contains: query } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true, name: true, email: true, role: true, image: true, createdAt: true,
        _count: { select: { campaigns: true, posts: true, characters: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <div>
          <CardTitle className="text-base">用户管理</CardTitle>
          <CardDescription>共 {total} 位用户</CardDescription>
        </div>
        {/* 搜索 */}
        <form className="flex items-center gap-2" method="GET">
          <input type="hidden" name="tab" value="users" />
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              name="q"
              defaultValue={query}
              placeholder="搜索用户名或邮箱..."
              className="h-8 rounded-md border pl-7 pr-2 text-xs bg-background w-48 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="h-8 px-3 rounded-md border text-xs font-medium hover:bg-muted transition-colors"
          >
            搜索
          </button>
          {query && (
            <a href="?tab=users" className="text-xs text-muted-foreground hover:text-primary">
              清除
            </a>
          )}
        </form>
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
                <th className="text-right px-4 py-2 font-medium text-xs hidden md:table-cell">数据</th>
                <th className="text-right px-4 py-2 font-medium text-xs">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {query ? "未找到匹配的用户" : "暂无用户"}
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-2 font-medium text-xs">
                      <Link href={`/profile`} className="text-primary hover:underline">{u.name || "未命名"}</Link>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground text-xs">{u.email}</td>
                    <td className="px-4 py-2">
                      <Badge variant={u.role === "ADMIN" ? "default" : "outline"} className="text-[10px]">
                        {u.role === "ADMIN" ? "管理员" : "用户"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground hidden sm:table-cell">
                      {new Date(u.createdAt).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground text-right hidden md:table-cell">
                      {u._count.campaigns}战役 {u._count.posts}战报 {u._count.characters}角色
                    </td>
                    <td className="px-4 py-2 text-right">
                      <AdminUserActions userId={u.id} userName={u.name || "未命名"} currentRole={u.role} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <span className="text-xs text-muted-foreground">
              第 {page}/{totalPages} 页，共 {total} 条
            </span>
            <div className="flex gap-1">
              {page > 1 && (
                <a
                  href={`?tab=users&page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="h-3 w-3" />上一页
                </a>
              )}
              {page < totalPages && (
                <a
                  href={`?tab=users&page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted transition-colors"
                >
                  下一页<ChevronRight className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ================================================================
 *  战役管理标签页
 * ================================================================ */

async function CampaignsTab({ page, query }: { page: number; query: string }) {
  const where: any = {};
  if (query) {
    where.OR = [
      { title: { contains: query } },
      { slug: { contains: query } },
    ];
  }

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true, title: true, slug: true, description: true, createdAt: true,
        dm: { select: { id: true, name: true } },
        _count: { select: { members: true, posts: true, characters: true, diceRolls: true } },
      },
    }),
    prisma.campaign.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <div>
          <CardTitle className="text-base">战役管理</CardTitle>
          <CardDescription>共 {total} 个战役</CardDescription>
        </div>
        <form className="flex items-center gap-2" method="GET">
          <input type="hidden" name="tab" value="campaigns" />
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              name="q"
              defaultValue={query}
              placeholder="搜索标题或 slug..."
              className="h-8 rounded-md border pl-7 pr-2 text-xs bg-background w-48 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="h-8 px-3 rounded-md border text-xs font-medium hover:bg-muted transition-colors"
          >
            搜索
          </button>
          {query && (
            <a href="?tab=campaigns" className="text-xs text-muted-foreground hover:text-primary">
              清除
            </a>
          )}
        </form>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-2 font-medium text-xs">战役名</th>
                <th className="text-left px-4 py-2 font-medium text-xs">DM</th>
                <th className="text-left px-4 py-2 font-medium text-xs hidden sm:table-cell">Slug</th>
                <th className="text-right px-4 py-2 font-medium text-xs hidden md:table-cell">成员</th>
                <th className="text-right px-4 py-2 font-medium text-xs hidden md:table-cell">战报</th>
                <th className="text-right px-4 py-2 font-medium text-xs hidden lg:table-cell">掷骰</th>
                <th className="text-right px-4 py-2 font-medium text-xs">操作</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {query ? "未找到匹配的战役" : "暂无战役"}
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-2 text-xs font-medium">
                      <Link href={`/campaigns/${c.slug}`} className="hover:text-primary transition-colors">
                        {c.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{c.dm.name}</td>
                    <td className="px-4 py-2 text-xs font-mono text-muted-foreground hidden sm:table-cell">{c.slug}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground text-right hidden md:table-cell">{c._count.members}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground text-right hidden md:table-cell">{c._count.posts}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground text-right hidden lg:table-cell">{c._count.diceRolls}</td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <CampaignEditButton campaignId={c.id} currentTitle={c.title} currentDescription={c.description} />
                        <AdminDeleteCampaign campaignId={c.id} campaignTitle={c.title} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <span className="text-xs text-muted-foreground">
              第 {page}/{totalPages} 页，共 {total} 条
            </span>
            <div className="flex gap-1">
              {page > 1 && (
                <a
                  href={`?tab=campaigns&page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="h-3 w-3" />上一页
                </a>
              )}
              {page < totalPages && (
                <a
                  href={`?tab=campaigns&page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted transition-colors"
                >
                  下一页<ChevronRight className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
