/**
 * 删除排期场次按钮（仅 DM）
 */
"use client";
import { deleteScheduleEvent } from "@/app/(main)/campaigns/[slug]/schedule/actions";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export function DeleteScheduleButton({ campaignSlug, eventId }: { campaignSlug: string; eventId: string }) {
  async function handleDelete() {
    if (!confirm("确定删除这个场次？")) return;
    try { await deleteScheduleEvent(campaignSlug, eventId); } catch { toast.error("删除失败"); }
  }
  return <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive"><Trash2 className="h-3 w-3" /></Button>;
}