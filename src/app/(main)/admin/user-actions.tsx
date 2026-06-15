/**
 * 管理员用户操作组件（客户端组件）
 * 
 * 管理员可修改其他用户的角色（PLAYER / DM / ADMIN）
 */

"use client";

import { useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { changeUserRole } from "./actions";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  PLAYER: "玩家",
  DM: "DM",
  ADMIN: "管理员",
};

const btnClass = "inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-xs font-medium transition-colors border border-transparent hover:bg-accent hover:text-accent-foreground h-8 px-2";

export function AdminUserActions({
  userId,
  userName,
  currentRole,
}: {
  userId: string;
  userName: string;
  currentRole: string;
}) {
  const { data: session } = useSession();
  const isSelf = session?.user?.id === userId;

  async function handleRoleChange(newRole: string) {
    try {
      await changeUserRole(userId, newRole);
      toast.success(userName + " 的角色已更新为 " + ROLE_LABELS[newRole]);
    } catch (e: any) {
      toast.error(e.message || "操作失败");
    }
  }

  if (isSelf) {
    return <span className="text-xs text-muted-foreground">当前用户</span>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={btnClass}>
        改角色
        <ChevronDown className="h-3 w-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {["PLAYER", "DM", "ADMIN"].map((role) => (
          <DropdownMenuItem
            key={role}
            onClick={() => handleRoleChange(role)}
            disabled={role === currentRole}
          >
            {ROLE_LABELS[role]}
            {role === currentRole && " ✓"}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}