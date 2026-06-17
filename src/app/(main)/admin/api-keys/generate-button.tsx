/**
 * 生成 API 密钥按钮（客户端组件）
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { generateApiKey } from "./actions";
import { Plus, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export function GenerateKeyButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    if (!name.trim()) {
      toast.error("请输入密钥名称");
      return;
    }
    setLoading(true);
    try {
      const result = await generateApiKey(name.trim());
      setRawKey(result.rawKey);
      toast.success("API 密钥已生成");
    } catch (e: any) {
      toast.error(e.message || "生成失败");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (rawKey) {
      navigator.clipboard.writeText(rawKey);
      setCopied(true);
      toast.success("已复制到剪贴板");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleClose(open: boolean) {
    setOpen(open);
    if (!open) {
      setName("");
      setRawKey(null);
      setCopied(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" />
          生成新密钥
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>生成 API 密钥</DialogTitle>
          <DialogDescription>
            为 Bot 集成创建一个新的 API 密钥。密钥仅在此时显示一次。
          </DialogDescription>
        </DialogHeader>

        {!rawKey ? (
          <div className="space-y-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="密钥名称，如 astrbot-prod"
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-destructive">
              ⚠ 请立即复制并妥善保管此密钥，关闭后将无法再次查看！
            </p>
            <div className="flex gap-2">
              <Input
                value={rawKey}
                readOnly
                className="font-mono text-xs"
              />
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          {!rawKey ? (
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? "生成中..." : "生成"}
            </Button>
          ) : (
            <Button variant="outline" onClick={() => handleClose(false)}>
              我已保存，关闭
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
