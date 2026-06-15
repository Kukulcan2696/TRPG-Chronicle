/**
 * 战役概览页
 * 
 * 功能：
 * - 顶部：战役标题、DM、简介、写战报按钮
 * - 子导航栏：概览/战报/角色/百科/时间线/骰子/排期/随机表
 * - 统计卡片：战报数、角色数、百科数、成员数
 * - 下方双栏：最近战报 + 成员列表
 * - DM 邀请区：生成/复制邀请链接
 * 
 * 数据获取：prisma.campaign.findUnique → include 关联数据
 */

import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText, Users, BookOpen, Clock, Dices, Calendar, Table2, Settings, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { InviteSection } from "./invite-section";

interface PageProps { params: Promise<{ slug: string }> }

// 子导航配置：修改这里即可增减导航项
const subNavItems = [
  { href: "", label: "概览", icon: BookOpen },
  { href: "/posts", label: "战报", icon: ScrollText },
  { href: "/characters", label: "角色", icon: Users },
  { href: "/wiki", label: "百科", icon: BookOpen },
  { href: "/timeline", label: "时间线", icon: Clock },
  { href: "/dice", label: "骰子", icon: Dices },
  { href: "/schedule", label: "排期", icon: Calendar },
  { href: "/tables", label: "随机表", icon: Table2 },
];

export default async function CampaignPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth();

  // 查询战役 + 关联数据（DM、战报、成员、计数、邀请码）
  const campaign = await prisma.campaign.findUnique({
    where: { slug },
    include: {
      dm: { select: { id: true, name: true } },
      posts: { where: { published: true }, orderBy: { createdAt: "desc" }, take: 5, include: { author: { select: { name: true } } } },
      members: { include: { user: { select: { id: true, name: true } } } },
      _count: { select: { posts: true, characters: true, worldEntries: true } },
    },
  });
  if (!campaign) notFound();

  const isMember = campaign.members.some((m) => m.userId === session?.user?.id);
  const isDM = campaign.dmId === session?.user?.id;

  return (
    <div className="space-y-6">
      {/* ===== 标题栏 + 操作按钮 ===== */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{campaign.title}</h1>
          <p className="text-muted-foreground mt-1">DM: {campaign.dm.name}</p>
          {campaign.description && (
            <p className="mt-2 text-muted-foreground max-w-2xl">{campaign.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          {isMember && (
            <Link href={`/campaigns/${slug}/posts/new`} className={buttonVariants()}>
              <ScrollText className="mr-2 h-4 w-4" />写战报
            </Link>
          )}
          {isDM && (
            <Link href={`/campaigns/${slug}/edit`} className={buttonVariants({ variant: "outline" })}>
              <Settings className="mr-2 h-4 w-4" />设置
            </Link>
          )}
        </div>
      </div>

      {/* ===== 子导航栏 ===== */}
      <div className="flex gap-1 border-b pb-2 overflow-x-auto">
        {subNavItems.map((item) => (
          <Link
            key={item.href}
            href={`/campaigns/${slug}${item.href}`}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </div>

      {/* ===== 统计卡片 ===== */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "战报", icon: ScrollText, val: campaign._count.posts },
          { label: "角色", icon: Users, val: campaign._count.characters },
          { label: "百科条目", icon: BookOpen, val: campaign._count.worldEntries },
          { label: "成员", icon: Users, val: campaign.members.length },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.val}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ===== DM 邀请区 ===== */}
      {isDM && <InviteSection slug={slug} />}

      {/* ===== 最近战报 + 成员列表 ===== */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 最近战报 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">最近战报</CardTitle>
          </CardHeader>
          <CardContent>
            {campaign.posts.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无战报</p>
            ) : (
              <ul className="space-y-2">
                {campaign.posts.map((post) => (
                  <li key={post.id}>
                    <Link
                      href={`/campaigns/${slug}/posts/${post.slug}`}
                      className="text-sm hover:text-primary transition-colors"
                    >
                      {post.title}
                      <span className="text-xs text-muted-foreground ml-2">
                        by {post.author.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* 成员列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">成员</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {campaign.members.map((m) => (
                <li key={m.userId} className="flex items-center gap-2 text-sm">
                  <span>{m.user.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {m.role === "DM" ? "DM" : "玩家"}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}