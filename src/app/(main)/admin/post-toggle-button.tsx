"use client";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { togglePostPublish } from "./actions";

export function TogglePublishButton({ postId, published }: { postId: string; published: boolean }) {
  const router = useRouter();

  async function handleToggle() {
    try {
      await togglePostPublish(postId);
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <button onClick={handleToggle} className="cursor-pointer" title="点击切换发布状态">
      <Badge variant={published ? "default" : "secondary"} className="text-xs">
        {published ? "已发布" : "草稿"}
      </Badge>
    </button>
  );
}
