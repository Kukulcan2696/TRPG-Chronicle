/**
 * 删除战役按钮（仅 DM，带确认弹窗）
 */
"use client";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { deleteCampaign } from "@/app/(main)/campaigns/[slug]/edit/actions";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export function DeleteCampaignButton({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false); const [loading, setLoading] = useState(false);
  async function handleDelete() { setLoading(true); try { await deleteCampaign(slug); } catch { toast.error("删除失败"); setLoading(false); setOpen(false); } }
  return (<AlertDialog open={open} onOpenChange={setOpen}><AlertDialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors border border-transparent bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 h-9 rounded-md px-3"><Trash2 className="mr-1 h-4 w-4" />删除战役</AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>确认删除</AlertDialogTitle><AlertDialogDescription>删除战役将同时删除所有战报、角色、百科等数据。此操作不可撤销。</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={handleDelete} disabled={loading}>{loading ? "删除中..." : "确认删除"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>);
}