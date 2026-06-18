/**
 * 管理员用户操作组件（客户端组件）
 */
"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { changeUserRole, deleteUser } from "./actions";
import { ChevronDown, Trash2 } from "lucide-react";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  USER: "用户",
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
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleRoleChange(newRole: string) {
    try {
      await changeUserRole(userId, newRole);
      toast.success(userName + " 的角色已更新为 " + ROLE_LABELS[newRole]);
    } catch (e: any) {
      toast.error(e.message || "操作失败");
    }
  }

  async function handleDelete() {
    try {
      await deleteUser(userId);
      toast.success("已删除用户 " + userName);
    } catch (e: any) {
      toast.error(e.message || "操作失败");
    }
    setConfirmDelete(false);
  }

  if (isSelf) {
    return <span className="text-xs text-muted-foreground">当前用户</span>;
  }

  return (
    <div className="flex items-center gap-1 justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger className={btnClass}>
          改角色
          <ChevronDown className="h-3 w-3" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {["USER", "ADMIN"].map((role) => (
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

      {confirmDelete ? (
        <div className="flex items-center gap-1">
          <Button variant="destructive" size="sm" onClick={handleDelete} className="h-7 text-xs">确认删除</Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)} className="h-7 text-xs">取消</Button>
        </div>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} className="h-7 w-7 p-0">
          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
        </Button>
      )}
    </div>
  );
}
