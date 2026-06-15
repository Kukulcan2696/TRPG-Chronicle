/**
 * 排期场次编辑页（弹窗模式，仅 DM）
 */
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateScheduleEvent } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

interface PageProps { params: Promise<{ slug: string; eventId: string }> }

export default async function EditSchedulePage({ params }: PageProps) {
  const { slug, eventId } = await params;
  const session = await auth();
  const event = await prisma.scheduleEvent.findUnique({
    where: { id: eventId },
    include: { campaign: { select: { title: true, dmId: true } } },
  });
  if (!event || event.campaign.dmId !== session?.user?.id) notFound();

  // 转换为 datetime-local 格式
  const dateStr = format(new Date(event.scheduledAt), "yyyy-MM-dd'T'HH:mm");

  return (<div className="max-w-2xl mx-auto space-y-6">
    <div><h1 className="text-2xl font-bold">编辑场次</h1><p className="text-muted-foreground">{event.title} · {event.campaign.title}</p></div>
    <Card><CardContent className="pt-6">
      <form action={updateScheduleEvent.bind(null, slug, eventId)} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="title">标题</Label><Input id="title" name="title" defaultValue={event.title} required /></div>
        <div className="space-y-2"><Label htmlFor="scheduledAt">时间</Label><Input id="scheduledAt" name="scheduledAt" type="datetime-local" defaultValue={dateStr} required /></div>
        <div className="space-y-2"><Label htmlFor="location">地点</Label><Input id="location" name="location" defaultValue={event.location || ""} /></div>
        <div className="space-y-2"><Label htmlFor="notes">备注</Label><Textarea id="notes" name="notes" rows={3} defaultValue={event.notes || ""} /></div>
        <Button type="submit">保存修改</Button>
      </form>
    </CardContent></Card>
  </div>);
}