/**
 * 随机表页面（弹窗模式）
 * 
 * 每个表卡片可展开查看条目，点击"掷"按钮随机选一条结果。
 * 表创建者可以看到编辑和删除按钮。
 * tableData 格式: JSON 数组 [{ range: "1", result: "地精伏击" }, ...]
 */

import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ListPlus, Table } from "lucide-react";
import { RollableTable } from "@/components/tables/rollable-table";

interface PageProps { params: Promise<{ slug: string }> }

export default async function TablesPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth();

  const campaign = await prisma.campaign.findUnique({
    where: { slug }, select: { id: true, title: true },
  });
  if (!campaign) notFound();

  const tables = await prisma.randomTable.findMany({
    where: { campaignId: campaign.id },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { id: true, name: true } } },
  });

  // 当前用户 ID，用于判断是否显示编辑/删除按钮
  const currentUserId = session?.user?.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">随机表</h1>
          <p className="text-muted-foreground">
            <Link href={`/campaigns/${slug}`} className="hover:text-primary">{campaign.title}</Link>
            {" "}· {tables.length} 张表
          </p>
        </div>
        <Link href={`/campaigns/${slug}/tables/new`} className={buttonVariants()}>
          <ListPlus className="mr-2 h-4 w-4" />新建随机表
        </Link>
      </div>

      {tables.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Table className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">还没有随机表</h3>
            <p className="text-muted-foreground">创建遭遇表、战利品表等</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tables.map((t) => (
            <RollableTable
              key={t.id}
              id={t.id}
              title={t.title}
              description={t.description}
              tableData={t.tableData}
              authorName={t.author.name || "未知"}
              isOwner={currentUserId === t.author.id}
              campaignSlug={slug}
            />
          ))}
        </div>
      )}
    </div>
  );
}