"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteAdminCharacter } from "./actions";

export function DeleteCharButton({ charId, charName }: { charId: string; charName: string }) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setConfirming(true)} className="h-7 w-7 p-0">
        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
      </Button>
    );
  }
  return (
    <form action={deleteAdminCharacter.bind(null, charId)} className="flex items-center gap-1">
      <Button type="submit" variant="destructive" size="sm" className="h-7 text-xs">确认删除「{charName}」</Button>
      <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setConfirming(false)}>取消</Button>
    </form>
  );
}
