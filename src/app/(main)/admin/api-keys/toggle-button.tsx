/**
 * 启用/禁用 API 密钥按钮（客户端组件）
 */

"use client";

import { toggleApiKey } from "./actions";
import { Power, PowerOff } from "lucide-react";
import { toast } from "sonner";

export function ToggleKeyButton({ id, enabled }: { id: string; enabled: boolean }) {
  async function handleToggle() {
    try {
      await toggleApiKey(id);
      toast.success(enabled ? "已禁用" : "已启用");
    } catch (e: any) {
      toast.error(e.message || "操作失败");
    }
  }

  return (
    <button
      onClick={handleToggle}
      className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors border hover:bg-muted h-7 w-7"
      title={enabled ? "禁用" : "启用"}
    >
      {enabled ? (
        <PowerOff className="h-3.5 w-3.5 text-muted-foreground" />
      ) : (
        <Power className="h-3.5 w-3.5 text-muted-foreground" />
      )}
    </button>
  );
}
