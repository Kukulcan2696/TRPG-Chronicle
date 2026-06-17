/**
 * 管理后台标签导航
 */

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "overview", label: "概览" },
  { key: "users", label: "用户管理" },
  { key: "campaigns", label: "战役管理" },
];

export function AdminTabNav({ current }: { current: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function switchTab(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", key);
    params.delete("page");
    params.delete("q");
    router.push(`/admin?${params.toString()}`);
  }

  return (
    <div className="flex gap-1 border-b pb-0">
      {TABS.map((t) => (
        <button
          key={t.key}
          onClick={() => switchTab(t.key)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-t-md transition-colors border-b-2 -mb-[1px]",
            current === t.key
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
