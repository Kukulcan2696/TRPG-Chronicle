/**
 * 加入战役按钮（客户端组件）
 * 
 * 点击后调用 Server Action 加入战役，不触发 render 中的 revalidatePath。
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { joinCampaignByCode } from "../(main)/campaigns/[slug]/invite/actions";
import { LogIn, Loader2 } from "lucide-react";

export function JoinButton({ code }: { code: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleJoin() {
    setLoading(true);
    setError("");
    try {
      await joinCampaignByCode(code);
    } catch (e: any) {
      setError(e.message || "加入失败，可能邀请码无效");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button onClick={handleJoin} disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            加入中...
          </>
        ) : (
          <>
            <LogIn className="mr-2 h-4 w-4" />
            确认加入
          </>
        )}
      </Button>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}