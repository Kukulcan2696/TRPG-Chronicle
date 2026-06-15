/**
 * 仪表盘页面
 * 
 * 用户登录后的个人主页，展示：
 * - 欢迎区 + 个人统计概览
 * - 我管理的战役（DM）
 * - 我加入的战役（PLAYER）
 * - 最近活动（掷骰记录等）
 * 
 * 数据流：
 * 1. auth() 获取当前用户
 * 2. 并行查询：管理的战役、加入的战役、个人统计、最近活动
 * 3. 分区渲染
 */

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Plus, BookOpen, Crown, Users, ScrollText, UserPlus, Dices, Clock } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  // ===== 并行查询所有数据 =====
  const [dmCampaigns, memberCampaigns, myCharacters, diceHistory, totalPosts] = await Promise.all([
    // 我管理的战役（我是 DM 但可能没在 members 表里）
    prisma.campaign.findMany({
      where: { dmId: userId },
      include: {
        _count: { select: { members: true, posts: true, characters: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    // 我加入的战役（我是玩家但不是 DM）
    prisma.campaign.findMany({
      where: {
        dmId: { not: userId },
        members: { some: { userId } },
      },
      include: {
        dm: { select: { name: true } },
        _count: { select: { members: true, posts: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    // 我的角色
    prisma.character.findMany({
      where: { playerId: userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    // 最近掷骰记录
    prisma.diceRoll.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    // 我写过的战报总数
    prisma.post.count({ where: { authorId: userId } }),
  ]);

  return (
    <div className="space-y-6">
      {/* ===== 欢迎区 ===== */}
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarImage src={session.user.image || ""} />
          <AvatarFallback className="text-xl">
            {session.user.name?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            欢迎回来，{session.user.name || "冒险者"}
          </h1>
          <p className="text-muted-foreground">
            你参与了 {dmCampaigns.length + memberCampaigns.length} 个战役，创建了 {myCharacters.length} 个角色
          </p>
        </div>
        <div className="ml-auto">
          <Link href="/campaigns/new" className={buttonVariants()}>
            <Plus className="mr-2 h-4 w-4" />创建战役
          </Link>
        </div>
      </div>

      <Separator />

      {/* ===== 统计卡片 ===== */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {[
          { label: "管理的战役", icon: Crown, val: dmCampaigns.length },
          { label: "加入的战役", icon: Users, val: memberCampaigns.length },
          { label: "我的角色", icon: UserPlus, val: myCharacters.length },
          { label: "战报总数", icon: ScrollText, val: totalPosts },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-2xl font-bold">{s.val}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ===== 我管理的战役 ===== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            我管理的战役
          </h2>
          <Link href="/campaigns/new" className="text-sm text-primary hover:underline">
            + 新建
          </Link>
        </div>

        {dmCampaigns.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent>
              <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">还没有作为 DM 创建战役</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {dmCampaigns.map((c) => (
              <Link key={c.id} href={`/campaigns/${c.slug}`}>
                <Card className="h-full hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{c.title}</CardTitle>
                    <CardDescription className="text-xs">
                      {c._count.members} 成员 · {c._count.posts} 战报 · {c._count.characters} 角色
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ===== 我加入的战役 ===== */}
      {memberCampaigns.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              我加入的战役
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {memberCampaigns.map((c) => (
              <Link key={c.id} href={`/campaigns/${c.slug}`}>
                <Card className="h-full hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{c.title}</CardTitle>
                    <CardDescription className="text-xs">
                      DM: {c.dm.name} · {c._count.members} 成员 · {c._count.posts} 战报
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ===== 最近活动 ===== */}
      {(diceHistory.length > 0 || myCharacters.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* 最近骰子 */}
          {diceHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Dices className="h-4 w-4" />最近掷骰
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {diceHistory.map((d) => (
                    <div key={d.id} className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary" className="font-mono text-xs shrink-0">{d.formula}</Badge>
                      <span className="font-bold">{d.result}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(d.createdAt).toLocaleDateString("zh-CN")}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 我的角色 */}
          {myCharacters.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />我的角色
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {myCharacters.map((ch) => (
                    <div key={ch.id} className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={ch.portrait || ""} />
                        <AvatarFallback className="text-xs">{ch.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{ch.name}</span>
                      <Badge variant="outline" className="text-xs ml-auto">{ch.system}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}