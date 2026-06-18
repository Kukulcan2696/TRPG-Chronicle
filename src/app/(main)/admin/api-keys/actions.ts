/**
 * API Key 管理 Server Actions
 * 仅 ADMIN 角色可操作
 */

"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createHash, randomBytes } from "crypto";

async function logAction(action: string, target: string) {
  const session = await auth();
  if (!session?.user?.id) return;
  await prisma.auditLog.create({
    data: { adminId: session.user.id, action, target },
  });
}

/**
 * 生成新的 API 密钥
 * 返回完整的原始密钥（仅这一次可查看）
 */
export async function generateApiKey(name: string) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    throw new Error("权限不足");
  }

  const rawKey = randomBytes(32).toString("hex");
  const prefix = rawKey.slice(0, 8);
  const hashedKey = createHash("sha256").update(rawKey).digest("hex");

  await prisma.apiKey.create({
    data: { name, key: hashedKey, prefix },
  });

  await logAction("GENERATE_API_KEY", name);
  revalidatePath("/admin/api-keys");
  return { rawKey, prefix };
}

/**
 * 切换 API 密钥启用/禁用状态
 */
export async function toggleApiKey(id: string) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    throw new Error("权限不足");
  }

  const existing = await prisma.apiKey.findUnique({ where: { id } });
  if (!existing) throw new Error("API 密钥不存在");

  await prisma.apiKey.update({
    where: { id },
    data: { enabled: !existing.enabled },
  });

  await logAction("TOGGLE_API_KEY", existing.name);
  revalidatePath("/admin/api-keys");
}

/**
 * 删除 API 密钥
 */
export async function deleteApiKey(id: string) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    throw new Error("权限不足");
  }

  const existing = await prisma.apiKey.findUnique({ where: { id }, select: { name: true } });
  await prisma.apiKey.delete({ where: { id } });

  await logAction("DELETE_API_KEY", existing?.name || id);
  revalidatePath("/admin/api-keys");
}
