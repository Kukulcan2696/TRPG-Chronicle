/**
 * 管理员战役操作组件（客户端组件）
 * 
 * 管理员可以删除任意战役（含确认对话框）
 */

"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteCampaign } from "./actions";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

const btnClass = "inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-xs font-medium transition-colors border border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90 h-7 px-2";

export function AdminDeleteCampaign({
  campaignId,
  campaignTitle,
}: {
  campaignId: string;
  campaignTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await deleteCampaign(campaignId);
      toast.success("已删除战役: " + campaignTitle);
    } catch (e: any) {
      toast.error(e.message || "删除失败");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger className={btnClass}>
        <Trash2 className="h-3 w-3" />
        删除
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除战役</AlertDialogTitle>
          <AlertDialogDescription>
            将永久删除「{campaignTitle}」及其所有战报、角色、百科等数据。此操作不可撤销。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading}>
            {loading ? "删除中..." : "确认删除"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}