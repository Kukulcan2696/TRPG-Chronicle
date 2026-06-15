import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListPlus, Table } from "lucide-react";

interface PageProps { params: Promise<{ slug: string }> }

export default async function TablesPage({ params }: PageProps) {
  const { slug } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { slug }, select: { id: true, title: true } });
  if (!campaign) notFound();

  const tables = await prisma.randomTable.findMany({
    where: { campaignId: campaign.id },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
  });

  return (<div className="space-y-6">
    <div className="flex items-center justify-between">
      <div><h1 className="text-2xl font-bold">随机表</h1><p className="text-muted-foreground"><Link href={`/campaigns/${slug}`} className="hover:text-primary">{campaign.title}</Link> · {tables.length} 张表</p></div>
      <Link href={`/campaigns/${slug}/tables/new`} className={buttonVariants()}><ListPlus className="mr-2 h-4 w-4" />新建随机表</Link>
    </div>
    {tables.length === 0 ? (
      <Card className="text-center py-12"><CardContent><Table className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-semibold mb-2">还没有随机表</h3><p className="text-muted-foreground">创建遭遇表、战利品表等</p></CardContent></Card>
    ) : (
      <div className="grid gap-3">
        {tables.map((t) => (
          <Card key={t.id} className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t.title}</CardTitle>
              <p className="text-xs text-muted-foreground">{t.description || "无描述"} · by {t.author.name}</p>
            </CardHeader>
          </Card>
        ))}
      </div>
    )}
  </div>);
}