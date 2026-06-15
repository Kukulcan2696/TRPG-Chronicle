import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createScheduleEvent } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PageProps { params: Promise<{ slug: string }> }

export default async function NewSchedulePage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth();
  const campaign = await prisma.campaign.findUnique({ where: { slug }, select: { id: true, title: true, dmId: true } });
  if (!campaign) notFound();
  if (session?.user?.id !== campaign.dmId) notFound();

  return (<div className="max-w-2xl mx-auto space-y-6">
    <div><h1 className="text-2xl font-bold">安排场次</h1><p className="text-muted-foreground">为「{campaign.title}」安排新的跑团场次</p></div>
    <Card><CardContent className="pt-6">
      <form action={createScheduleEvent.bind(null, slug)} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="title">标题</Label><Input id="title" name="title" placeholder="例：第三次跑团" required /></div>
        <div className="space-y-2"><Label htmlFor="scheduledAt">时间</Label><Input id="scheduledAt" name="scheduledAt" type="datetime-local" required /></div>
        <div className="space-y-2"><Label htmlFor="location">地点</Label><Input id="location" name="location" placeholder="线上 / 线下地址" /></div>
        <div className="space-y-2"><Label htmlFor="notes">备注</Label><Textarea id="notes" name="notes" rows={3} placeholder="额外说明..." /></div>
        <Button type="submit">创建场次</Button>
      </form>
    </CardContent></Card>
  </div>);
}