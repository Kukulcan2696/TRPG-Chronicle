/**
 * Wiki 条目详情页（弹窗模式）
 */
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarkdownRenderer } from "@/lib/markdown";
import { DeleteWikiButton } from "@/components/wiki/delete-button";
import { Pencil } from "lucide-react";

interface PageProps { params: Promise<{ slug: string; entryId: string }> }
const TYPE_LABELS: Record<string, string> = { LOCATION: "地点", NPC: "NPC", FACTION: "势力", ITEM: "物品", LORE: "传说" };

export default async function WikiDetailPage({ params }: PageProps) {
  const { slug, entryId } = await params;
  const session = await auth();
  const entry = await prisma.worldEntry.findUnique({
    where: { id: entryId },
    include: { campaign: { select: { slug: true } }, author: { select: { id: true, name: true } }, parent: { select: { id: true, title: true } } },
  });
  if (!entry || entry.campaign.slug !== slug) notFound();
  const isAuthor = session?.user?.id === entry.author.id;

  return (<div className="max-w-3xl mx-auto space-y-6">
    <div className="flex items-start justify-between">
      <div><div className="flex items-center gap-2 mb-2"><h1 className="text-3xl font-bold">{entry.title}</h1><Badge>{TYPE_LABELS[entry.type] || entry.type}</Badge></div>
        {entry.parent && <p className="text-sm text-muted-foreground">隶属于：<Link href={`/campaigns/${slug}/wiki/${entry.parent.id}`} className="hover:text-primary">{entry.parent.title}</Link></p>}
      </div>
      {isAuthor && (<div className="flex gap-2">
        <Link href={`/campaigns/${slug}/wiki/${entryId}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}><Pencil className="mr-1 h-4 w-4" />编辑</Link>
        <DeleteWikiButton campaignSlug={slug} entryId={entryId} />
      </div>)}
    </div>
    {entry.content ? <MarkdownRenderer content={entry.content} /> : <p className="text-muted-foreground">暂无内容</p>}
    <p className="text-xs text-muted-foreground">由 {entry.author.name} 创建</p>
  </div>);
}