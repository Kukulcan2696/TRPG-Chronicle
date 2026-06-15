/**
 * 战役列表页
 * 
 * 功能：
 * - 分类展示：全部 / 我管理的 / 我加入的
 * - 每个战役卡片：封面、标题、简介、DM、统计、最后更新时间
 * - DM 可直接删除自己的战役（悬停显示删除按钮）
 * - 空状态引导
 */

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeleteCampaignButton } from "@/components/campaign/delete-button";
import { Separator } from "@/components/ui/separator";
import { Plus, BookOpen, Crown, Users, ScrollText, Calendar } from "lucide-react";

export default async function CampaignsPage() {
  const session = await auth();

  // ===== 查询所有相关战役 =====
  const campaigns = await prisma.campaign.findMany({
    where: {
      OR: [
        { dmId: session!.user!.id },
        { members: { some: { userId: session!.user!.id } } },
      ],
    },
    include: {
      dm: { select: { id: true, name: true } },
      _count: { select: { posts: true, characters: true, members: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const currentUserId = session?.user?.id;

  // 分类战役
  const dmCampaigns = campaigns.filter((c) => c.dm.id === currentUserId);
  const joinedCampaigns = campaigns.filter((c) => c.dm.id !== currentUserId);

  // 渲染战役卡片
  function CampaignCard({ c }: { c: (typeof campaigns)[0] }) {
    const isDM = c.dm.id === currentUserId;
    return (
      <Card className="h-full hover:border-primary/50 transition-colors relative group overflow-hidden">
        {/* ===== 封面图区域 ===== */}
        {c.coverImage ? (
          <div className="h-32 overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={c.coverImage}
              alt={c.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="h-24 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-primary/30" />
          </div>
        )}

        {/* ===== DM 删除按钮（悬停可见） ===== */}
        {isDM && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <DeleteCampaignButton slug={c.slug} />
          </div>
        )}

        {/* ===== 卡片信息 ===== */}
        <Link href={`/campaigns/${c.slug}`} className="block">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <CardTitle className="text-base truncate">{c.title}</CardTitle>
                <CardDescription className="text-xs flex items-center gap-1 mt-0.5">
                  {isDM ? (
                    <Crown className="h-3 w-3 text-amber-500" />
                  ) : (
                    <Users className="h-3 w-3" />
                  )}
                  {isDM ? "你主持" : `DM: ${c.dm.name}`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {/* 统计 */}
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs gap-1">
                <ScrollText className="h-3 w-3" />{c._count.posts}
              </Badge>
              <Badge variant="secondary" className="text-xs gap-1">
                <Users className="h-3 w-3" />{c._count.members}
              </Badge>
              <Badge variant="outline" className="text-xs gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(c.updatedAt).toLocaleDateString("zh-CN")}
              </Badge>
            </div>
          </CardContent>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ===== 标题栏 ===== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">战役</h1>
          <p className="text-muted-foreground">
            {dmCampaigns.length} 个主持 · {joinedCampaigns.length} 个参与
          </p>
        </div>
        <Link href="/campaigns/new" className={buttonVariants()}>
          <Plus className="mr-2 h-4 w-4" />
          新战役
        </Link>
      </div>

      {campaigns.length === 0 ? (
        /* ===== 空状态 ===== */
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">还没有战役</h3>
            <p className="text-muted-foreground mb-4">
              创建你的第一个战役，开始记录冒险故事
            </p>
            <Link href="/campaigns/new" className={buttonVariants()}>
              创建战役
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ===== 我管理的战役 ===== */}
          {dmCampaigns.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Crown className="h-4 w-4 text-amber-500" />
                <h2 className="font-semibold">我主持的战役</h2>
                <Badge variant="secondary" className="text-xs">{dmCampaigns.length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {dmCampaigns.map((c) => (
                  <CampaignCard key={c.id} c={c} />
                ))}
              </div>
            </div>
          )}

          {/* ===== 我加入的战役 ===== */}
          {joinedCampaigns.length > 0 && (
            <div>
              {dmCampaigns.length > 0 && <Separator className="my-2" />}
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-blue-500" />
                <h2 className="font-semibold">我参与的战役</h2>
                <Badge variant="secondary" className="text-xs">{joinedCampaigns.length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {joinedCampaigns.map((c) => (
                  <CampaignCard key={c.id} c={c} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}