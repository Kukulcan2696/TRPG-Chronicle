"use client";

import { Button } from "@/components/ui/button";
import { rsvpEvent } from "@/app/(main)/campaigns/[slug]/schedule/actions";
import { cn } from "@/lib/utils";
import { Check, HelpCircle, X } from "lucide-react";

const options = [
  { status: "GOING" as const, label: "参加", icon: Check, color: "bg-green-500/10 text-green-500 hover:bg-green-500/20" },
  { status: "MAYBE" as const, label: "待定", icon: HelpCircle, color: "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20" },
  { status: "CANT" as const, label: "缺席", icon: X, color: "bg-red-500/10 text-red-500 hover:bg-red-500/20" },
];

export function RSVPButtons({
  campaignSlug,
  eventId,
  currentStatus,
}: {
  campaignSlug: string;
  eventId: string;
  currentStatus: string | null;
}) {
  async function handleClick(status: "GOING" | "MAYBE" | "CANT") {
    await rsvpEvent(campaignSlug, eventId, status);
  }

  return (
    <div className="flex gap-1">
      {options.map((opt) => (
        <Button
          key={opt.status}
          size="sm"
          variant="ghost"
          className={cn(
            "gap-1 text-xs",
            currentStatus === opt.status && opt.color,
          )}
          onClick={() => handleClick(opt.status)}
        >
          <opt.icon className="h-3 w-3" />
          {opt.label}
        </Button>
      ))}
    </div>
  );
}