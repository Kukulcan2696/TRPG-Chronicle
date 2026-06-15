/**
 * Wiki 条目编辑页（弹窗模式）
 */
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateWikiEntry } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

interface PageProps { params: Promise<{ slug: string; entryId: string }> }

const TYPE_OPTIONS = [{ v: "LOCATION", l: "地点" },{ v: "NPC", l: "NPC" },{ v: "FACTION", l: "势力" },{ v: "ITEM", l: "物品" },{ v: "LORE", l: "传说" }];

export default async function EditWikiPage({ params }: PageProps) {
  const { slug, entryId } = await params;
  const session = await auth();
  const entry = await prisma.worldEntry.findUnique({ where: { id: entryId }, include: { campaign: { select: { title: true } } } });
  if (!entry || entry.authorId !== session?.user?.id) notFound();

  return (<div className="space-y-6">
    <div><h1 className="text-2xl font-bold">编辑百科条目</h1><p className="text-muted-foreground">{entry.campaign.title}</p></div>
    <Card><CardContent className="pt-6">
      <form action={updateWikiEntry.bind(null, slug, entryId)} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="title">标题</Label><Input id="title" name="title" defaultValue={entry.title} required /></div>
        <div className="space-y-2"><Label htmlFor="type">类型</Label><select id="type" name="type" className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm" defaultValue={entry.type}>{TYPE_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select></div>
        <div className="space-y-2"><Label htmlFor="content">内容 (Markdown)</Label><Textarea id="content" name="content" rows={12} className="font-mono text-sm" defaultValue={entry.content} /></div>
        <Button type="submit">保存修改</Button>
      </form>
    </CardContent></Card>
  </div>);
}