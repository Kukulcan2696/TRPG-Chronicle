/**
 * 删除 API 密钥按钮（客户端组件，含确认对话框）
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
import { deleteApiKey } from "./actions";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export function DeleteKeyButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await deleteApiKey(id);
      toast.success("已删除密钥: " + name);
    } catch (e: any) {
      toast.error(e.message || "删除失败");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors border hover:bg-destructive/10 h-7 w-7">
        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除 API 密钥</AlertDialogTitle>
          <AlertDialogDescription>
            将永久删除密钥「{name}」。使用此密钥的 Bot 将立即无法访问 API。
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
