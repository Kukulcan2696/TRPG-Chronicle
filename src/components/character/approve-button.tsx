"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { approveCharacter } from "./actions";

export function ApproveButton({ charId, charName }: { charId: string; charName: string }) {
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    try {
      await approveCharacter(charId);
      toast.success(`已批准角色「${charName}」`);
    } catch (e: any) {
      toast.error(e.message || "操作失败");
    }
    setLoading(false);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleApprove} disabled={loading}>
      <CheckCircle className="mr-1 h-4 w-4 text-emerald-500" />
      批准
    </Button>
  );
}
