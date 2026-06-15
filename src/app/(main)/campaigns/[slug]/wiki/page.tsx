import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus } from "lucide-react";

interface PageProps { params: Promise<{ slug: string }> }

const TYPE_LABELS: Record<string, string> = {
  LOCATION: "地点", NPC: "NPC", FACTION: "势力",
  ITEM: "物品", LORE: "传说",
};

export default async function WikiPage({ params }: PageProps) {
  const { slug } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { slug }, select: { id: true, title: true },
  });
  if (!campaign) notFound();

  const entries = await prisma.worldEntry.findMany({
    where: { campaignId: campaign.id },
    orderBy: [{ type: "asc" }, { title: "asc" }],
    include: { author: { select: { name: true } } },
  });

  return (<div className="space-y-6">
    <div className="flex items-center justify-between">
      <div><h1 className="text-2xl font-bold">世界观百科</h1>
        <p className="text-muted-foreground">
          <Link href={`/campaigns/${slug}`} className="hover:text-primary">{campaign.title}</Link> · {entries.length} 条目
        </p></div>
      <Link href={`/campaigns/${slug}/wiki/new`} className={buttonVariants()}>
        <Plus className="mr-2 h-4 w-4" />新建条目
      </Link>
    </div>
    {entries.length === 0 ? (
      <Card className="text-center py-12"><CardContent>
        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">还没有百科条目</h3>
        <p className="text-muted-foreground mb-4">开始构建你的世界观</p>
        <Link href={`/campaigns/${slug}/wiki/new`} className={buttonVariants()}>新建条目</Link>
      </CardContent></Card>
    ) : (
      <div className="grid gap-3">
        {entries.map((e) => (
          <Link key={e.id} href={`/campaigns/${slug}/wiki/${e.id}`}>
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{e.title}</CardTitle>
                  <Badge variant="outline">{TYPE_LABELS[e.type] || e.type}</Badge>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    )}
  </div>);
}