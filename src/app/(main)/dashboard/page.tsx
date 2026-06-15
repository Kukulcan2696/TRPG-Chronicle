/**
 * 仪表盘页面
 * 
 * 用户登录后的主页，展示：
 * - 我创建或加入的战役卡片列表
 * - 创建新战役按钮
 * 
 * 数据流：
 * 1. auth() 获取当前用户 → 未登录则重定向
 * 2. prisma.campaign.findMany() 查数据库 → 得到战役列表
 * 3. 渲染卡片，每个卡片链接到战役详情
 */

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen } from "lucide-react";

export default async function DashboardPage() {
  // 1. 获取当前登录用户
  const session = await auth();
  if (!session?.user) redirect("/login");

  // 2. 查询用户参与的战役
  //    OR: 我是 DM 或者我是成员
  //    include: 同时查关联数据（DM名字、计数）
  const campaigns = await prisma.campaign.findMany({
    where: {
      OR: [
        { dmId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      dm: { select: { name: true } },
      _count: { select: { members: true, posts: true, characters: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">仪表盘</h1>
          <p className="text-muted-foreground">欢迎回来，{session.user.name || "冒险者"}</p>
        </div>
        <Link href="/campaigns/new" className={buttonVariants()}>
          <Plus className="mr-2 h-4 w-4" />创建战役
        </Link>
      </div>

      {/* 空状态：没有战役时显示引导 */}
      {campaigns.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold">还没有战役</h3>
            <p className="text-muted-foreground">创建你的第一个战役，开始记录冒险故事</p>
            <Link href="/campaigns/new" className={buttonVariants()}>创建战役</Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <Link key={campaign.id} href={`/campaigns/${campaign.slug}`}>
              <Card className="h-full hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">{campaign.title}</CardTitle>
                  <CardDescription>DM: {campaign.dm.name || "未知"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{campaign._count.posts} 篇战报</Badge>
                    <Badge variant="secondary">{campaign._count.characters} 角色</Badge>
                    <Badge variant="secondary">{campaign._count.members} 成员</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}