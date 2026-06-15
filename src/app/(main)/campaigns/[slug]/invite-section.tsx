/**
 * DM 邀请区组件（客户端组件）
 * 
 * 功能：
 * - 生成/重新生成邀请链接
 * - 一键复制邀请链接到剪贴板
 * - 显示邀请状态
 * 
 * 邀请链接格式：/join?code=XXXXXXXX
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateInviteCode } from "./invite/actions";
import { Share2, Copy, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function InviteSection({ slug }: { slug: string }) {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // 构造完整的邀请链接
  const inviteUrl = inviteCode
    ? `${window.location.origin}/join?code=${inviteCode}`
    : "";

  /**
   * 调用 Server Action 生成邀请码
   */
  async function handleGenerate() {
    setLoading(true);
    try {
      const code = await generateInviteCode(slug);
      setInviteCode(code);
      toast.success("邀请链接已生成");
    } catch (e: any) {
      toast.error(e.message || "生成失败");
    } finally {
      setLoading(false);
    }
  }

  /**
   * 复制邀请链接到剪贴板
   */
  async function handleCopy() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success("已复制到剪贴板");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("复制失败，请手动复制");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          邀请成员
        </CardTitle>
      </CardHeader>
      <CardContent>
        {inviteCode ? (
          // 已生成邀请码 → 显示链接和操作按钮
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={inviteUrl}
                readOnly
                className="font-mono text-sm"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              将此链接分享给其他玩家即可加入战役。
              链接理论上可被任何人使用，请妥善保管。
            </p>
            <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={loading}>
              <RefreshCw className="mr-1 h-3 w-3" />
              重新生成（旧链接将失效）
            </Button>
          </div>
        ) : (
          // 未生成邀请码 → 显示生成按钮
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              生成邀请链接，分享给其他玩家加入战役
            </p>
            <Button onClick={handleGenerate} disabled={loading} variant="outline">
              <Share2 className="mr-2 h-4 w-4" />
              {loading ? "生成中..." : "生成邀请链接"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}