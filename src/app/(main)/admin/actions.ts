/**
 * 管理后台 Server Actions
 */

"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * 修改用户角色（仅 ADMIN 可操作）
 */
export async function changeUserRole(userId: string, newRole: string) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    throw new Error("权限不足");
  }

  if (userId === session.user.id) {
    throw new Error("不能修改自己的角色");
  }

  if (!["PLAYER", "DM", "ADMIN"].includes(newRole)) {
    throw new Error("无效的角色");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  revalidatePath("/admin");
}

/**
 * 删除任意战役（仅 ADMIN 可操作，会级联删除关联数据）
 */
export async function deleteCampaign(campaignId: string) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    throw new Error("权限不足");
  }

  // Prisma schema 设了 onDelete: Cascade，会自动删除关联数据
  await prisma.campaign.delete({ where: { id: campaignId } });

  revalidatePath("/admin");
}