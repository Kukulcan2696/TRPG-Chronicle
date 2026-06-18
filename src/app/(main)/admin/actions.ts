/**
 * 管理后台 Server Actions
 * 所有管理操作均写入 AuditLog
 */
"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/** 写入操作日志 */
async function logAction(action: string, target: string, details?: any) {
  const session = await auth();
  if (!session?.user?.id) return;
  await prisma.auditLog.create({
    data: {
      adminId: session.user.id,
      action,
      target,
      details: details ? JSON.stringify(details) : null,
    },
  });
}

function requireAdmin(session: any) {
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("权限不足");
  }
  return session.user;
}

/**
 * 修改用户角色
 */
export async function changeUserRole(userId: string, newRole: string) {
  const session = await auth();
  const admin = requireAdmin(session);
  if (userId === admin.id) throw new Error("不能修改自己的角色");
  if (!["USER", "ADMIN"].includes(newRole)) throw new Error("无效的角色");

  const user = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });
  await logAction("CHANGE_ROLE", `${user.name || user.email} → ${newRole}`);
  revalidatePath("/admin");
}

/**
 * 删除战役（级联）
 */
export async function deleteCampaign(campaignId: string) {
  const session = await auth();
  requireAdmin(session);
  const c = await prisma.campaign.findUnique({ where: { id: campaignId }, select: { title: true } });
  await prisma.campaign.delete({ where: { id: campaignId } });
  await logAction("DELETE_CAMPAIGN", c?.title || campaignId);
  revalidatePath("/admin");
}

/**
 * 删除掷骰记录
 */
export async function deleteDiceRoll(rollId: string) {
  const session = await auth();
  requireAdmin(session);
  const r = await prisma.diceRoll.findUnique({ where: { id: rollId }, select: { formula: true } });
  await prisma.diceRoll.delete({ where: { id: rollId } });
  await logAction("DELETE_DICE_ROLL", r?.formula || rollId);
  revalidatePath("/admin");
}

/**
 * 删除角色（管理员）
 */
export async function deleteAdminCharacter(charId: string) {
  const session = await auth();
  requireAdmin(session);
  const c = await prisma.character.findUnique({ where: { id: charId }, select: { name: true } });
  await prisma.character.delete({ where: { id: charId } });
  await logAction("DELETE_CHARACTER", c?.name || charId);
  revalidatePath("/admin");
}

/**
 * 删除战报（管理员）
 */
export async function deleteAdminPost(postId: string) {
  const session = await auth();
  requireAdmin(session);
  const p = await prisma.post.findUnique({ where: { id: postId }, select: { title: true } });
  await prisma.post.delete({ where: { id: postId } });
  await logAction("DELETE_POST", p?.title || postId);
  revalidatePath("/admin");
}

/**
 * 删除绑定（QQ用户绑定或QQ群绑定）
 */
export async function deleteBinding(id: string, type: "bot" | "group") {
  const session = await auth();
  requireAdmin(session);

  if (type === "bot") {
    const b = await prisma.botBinding.findUnique({ where: { id }, select: { platformId: true } });
    await prisma.botBinding.delete({ where: { id } });
    await logAction("DELETE_BOT_BINDING", `QQ ${b?.platformId || id}`);
  } else {
    const b = await prisma.groupBinding.findUnique({ where: { id }, select: { groupId: true } });
    await prisma.groupBinding.delete({ where: { id } });
    await logAction("DELETE_GROUP_BINDING", `群 ${b?.groupId || id}`);
  }
  revalidatePath("/admin");
}
