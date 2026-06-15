/**
 * 随机表删除按钮（客户端组件）
 * 
 * 点击后弹出确认对话框，确认后调用 Server Action 删除
 * 使用 AlertDialog 实现二次确认，防止误删
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
import { deleteRandomTable } from "@/app/(main)/campaigns/[slug]/tables/actions";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export function DeleteTableButton({
  campaignSlug,
  tableId,
}: {
  campaignSlug: string;
  tableId: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  /**
   * 执行删除
   * deleteRandomTable 是 Server Action，内部会 redirect
   */
  async function handleDelete() {
    setLoading(true);
    try {
      await deleteRandomTable(campaignSlug, tableId);
    } catch {
      toast.error("删除失败，请重试");
      setLoading(false);
      setOpen(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors border border-transparent hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 text-destructive hover:text-destructive"><Trash2 className="mr-1 h-3.5 w-3.5" />删除</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除随机表</AlertDialogTitle>
          <AlertDialogDescription>
            此操作不可撤销。确定要删除这张随机表吗？表中所有条目将被永久移除。
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