"use client";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { updateCharacterStatus } from "./actions";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "草稿", COMPLETE: "完成", APPROVED: "已批准",
};

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-amber-100 text-amber-800 border-amber-300",
  COMPLETE: "bg-emerald-100 text-emerald-800 border-emerald-300",
  APPROVED: "bg-blue-100 text-blue-800 border-blue-300",
};

export function CharStatusSelect({ charId, currentStatus }: { charId: string; currentStatus: string }) {
  const router = useRouter();

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    try {
      await updateCharacterStatus(charId, newStatus);
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <select
      defaultValue={currentStatus}
      onChange={handleChange}
      className={`text-xs rounded border px-1.5 py-0.5 cursor-pointer ${STATUS_STYLES[currentStatus] || ""}`}
    >
      {Object.entries(STATUS_LABELS).map(([val, label]) => (
        <option key={val} value={val}>{label}</option>
      ))}
    </select>
  );
}
