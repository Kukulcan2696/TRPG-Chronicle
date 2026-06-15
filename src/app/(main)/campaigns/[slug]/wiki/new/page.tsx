import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createWikiEntry } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PageProps { params: Promise<{ slug: string }> }

export default async function NewWikiPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth();
  const campaign = await prisma.campaign.findUnique({ where: { slug }, select: { id: true, title: true } });
  if (!campaign) notFound();

  return (<div className="max-w-2xl mx-auto space-y-6">
    <div><h1 className="text-2xl font-bold">新建百科条目</h1><p className="text-muted-foreground">为「{campaign.title}」添加设定</p></div>
    <Card><CardContent className="pt-6">
      <form action={createWikiEntry.bind(null, slug)} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="title">标题</Label><Input id="title" name="title" placeholder="例：永望城" required /></div>
        <div className="space-y-2"><Label htmlFor="slug">URL 标识</Label><Input id="slug" name="slug" placeholder="everlook" required pattern="[a-z0-9-]+" /></div>
        <div className="space-y-2">
          <Label htmlFor="type">类型</Label>
          <select id="type" name="type" className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm" defaultValue="LOCATION">
            <option value="LOCATION">地点</option><option value="NPC">NPC</option><option value="FACTION">势力</option><option value="ITEM">物品</option><option value="LORE">传说</option>
          </select>
        </div>
        <div className="space-y-2"><Label htmlFor="content">内容 (Markdown)</Label>
          <Textarea id="content" name="content" rows={12} className="font-mono text-sm" placeholder="描述这个世界观条目..." /></div>
        <Button type="submit">创建条目</Button>
      </form>
    </CardContent></Card>
  </div>);
}