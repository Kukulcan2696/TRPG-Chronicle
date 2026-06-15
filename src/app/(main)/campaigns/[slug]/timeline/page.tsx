/**
 * 战役时间线页（弹窗模式）
 * 
 * DM 可手动添加事件，也可编辑/删除已有事件。
 * 战报自动显示在时间线中（来自 Post 的 gameDate），不可在此编辑。
 */
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addTimelineEvent, updateTimelineEvent, deleteTimelineEvent } from "./actions";
import { Clock, Plus, Pencil, Trash2 } from "lucide-react";

interface PageProps { params: Promise<{ slug: string }> }

export default async function TimelinePage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth();
  const campaign = await prisma.campaign.findUnique({ where: { slug }, select: { id: true, title: true, dmId: true } });
  if (!campaign) notFound();

  const events = await prisma.timelineEvent.findMany({
    where: { campaignId: campaign.id },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { post: { select: { slug: true, title: true } }, worldEntry: { select: { id: true, title: true } } },
  });
  const posts = await prisma.post.findMany({
    where: { campaignId: campaign.id, published: true, gameDate: { not: null } },
    orderBy: { gameDate: "asc" },
    select: { id: true, title: true, slug: true, gameDate: true, sessionNumber: true },
  });
  const isDM = session?.user?.id === campaign.dmId;

  return (<div className="space-y-6 max-w-3xl mx-auto">
    <div className="flex items-center justify-between">
      <div><h1 className="text-2xl font-bold">战役时间线</h1><p className="text-muted-foreground"><Link href={`/campaigns/${slug}`} className="hover:text-primary">{campaign.title}</Link></p></div>
    </div>

    {/* DM 添加事件表单 */}
    {isDM && (<Card><CardHeader><CardTitle className="text-base">添加时间线事件</CardTitle></CardHeader><CardContent>
      <form action={addTimelineEvent.bind(null, slug)} className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[150px] space-y-1"><Label htmlFor="title" className="text-xs">事件标题</Label><Input id="title" name="title" placeholder="事件名称" required /></div>
        <div className="w-[140px] space-y-1"><Label htmlFor="gameDate" className="text-xs">日期</Label><Input id="gameDate" name="gameDate" placeholder="第3年·夏" required /></div>
        <div className="flex-1 min-w-[200px] space-y-1"><Label htmlFor="description" className="text-xs">描述</Label><Input id="description" name="description" placeholder="简述..." /></div>
        <Button type="submit" size="sm"><Plus className="mr-1 h-3 w-3" />添加</Button>
      </form>
    </CardContent></Card>)}

    <div className="relative border-l-2 border-muted pl-6 space-y-6">
      {events.length === 0 && posts.length === 0 && (<Card className="text-center py-8"><CardContent><Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">暂无时间线事件</p></CardContent></Card>)}

      {/* 战报（自动聚合，不可直接编辑） */}
      {posts.map((post) => (<div key={`post-${post.id}`} className="relative">
        <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
        <Link href={`/campaigns/${slug}/posts/${post.slug}`}><Card className="hover:border-primary/50 transition-colors"><CardHeader className="pb-2"><CardTitle className="text-base">{post.title}</CardTitle>{post.gameDate && <p className="text-xs text-muted-foreground">{new Date(post.gameDate).toLocaleDateString("zh-CN")}{post.sessionNumber && ` · 第${post.sessionNumber}次`}</p>}</CardHeader></Card></Link>
      </div>))}

      {/* 手动事件（DM 可编辑/删除） */}
      {events.map((event) => (<div key={event.id} className="relative">
        <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-amber-500 border-2 border-background" />
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base">{event.title}</CardTitle>
                <p className="text-xs text-muted-foreground">{event.gameDate}</p>
              </div>
              {isDM && !event.post && (<div className="flex gap-1">
                {/* 编辑按钮 → 内联快速编辑 */}
                <form action={updateTimelineEvent.bind(null, slug, event.id)} className="flex gap-2 items-end">
                  <input type="hidden" name="title" value={event.title} />
                  <input type="hidden" name="gameDate" value={event.gameDate} />
                  <input name="description" defaultValue={event.description || ""} className="h-7 w-32 text-xs border rounded px-1.5 bg-background" placeholder="描述" />
                  <Button type="submit" size="sm" variant="ghost" className="h-7 text-xs"><Pencil className="h-3 w-3" /></Button>
                </form>
                <form action={deleteTimelineEvent.bind(null, slug, event.id)}>
                  <Button type="submit" size="sm" variant="ghost" className="h-7 text-xs text-destructive"><Trash2 className="h-3 w-3" /></Button>
                </form>
              </div>)}
            </div>
          </CardHeader>
          {event.description && <CardContent><p className="text-sm text-muted-foreground">{event.description}</p></CardContent>}
        </Card>
      </div>))}
    </div>
  </div>);
}