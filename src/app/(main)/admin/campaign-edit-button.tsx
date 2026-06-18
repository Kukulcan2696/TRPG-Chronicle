"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil } from "lucide-react";
import { updateCampaign } from "./actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function CampaignEditButton({
  campaignId,
  currentTitle,
  currentDescription,
}: {
  campaignId: string;
  currentTitle: string;
  currentDescription: string | null;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await updateCampaign(campaignId, form);
      toast.success("战役已更新");
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "更新失败");
    }
  }

  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="h-7 w-7 p-0">
        <Pencil className="h-3 w-3 text-muted-foreground hover:text-primary" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
        <h3 className="font-semibold mb-4">编辑战役</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium">标题</label>
            <Input name="title" defaultValue={currentTitle} required className="h-9 mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium">描述</label>
            <Textarea name="description" defaultValue={currentDescription || ""} rows={3} className="mt-1" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>取消</Button>
            <Button type="submit" size="sm">保存</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
