import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MarkdownRenderer } from "@/lib/markdown";
import { ArrowLeft } from "lucide-react";

interface PageProps { params: Promise<{ slug: string; entryId: string }> }
const TYPE_LABELS: Record<string, string> = { LOCATION: "地点", NPC: "NPC", FACTION: "势力", ITEM: "物品", LORE: "传说" };

export default async function WikiDetailPage({ params }: PageProps) {
  const { slug, entryId } = await params;
  const entry = await prisma.worldEntry.findUnique({
    where: { id: entryId },
    include: { campaign: { select: { slug: true } }, author: { select: { name: true } }, parent: { select: { id: true, title: true } } },
  });
  if (!entry || entry.campaign.slug !== slug) notFound();

  return (<div className="max-w-3xl mx-auto space-y-6">
    <Link href={`/campaigns/${slug}/wiki`} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="mr-1 h-4 w-4" />返回百科</Link>
    <div><div className="flex items-center gap-2 mb-2"><h1 className="text-3xl font-bold">{entry.title}</h1><Badge>{TYPE_LABELS[entry.type] || entry.type}</Badge></div>
      {entry.parent && <p className="text-sm text-muted-foreground">隶属于：<Link href={`/campaigns/${slug}/wiki/${entry.parent.id}`} className="hover:text-primary">{entry.parent.title}</Link></p>}
    </div>
    {entry.content ? <MarkdownRenderer content={entry.content} /> : <p className="text-muted-foreground">暂无内容</p>}
    <p className="text-xs text-muted-foreground">由 {entry.author.name} 创建</p>
  </div>);
}