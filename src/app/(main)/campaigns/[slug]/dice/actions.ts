/**
 * 骰子 Server Actions
 *
 * 掷骰结果按战役隔离存储，支持：
 * - 角色关联（characterId）
 * - 检定原因（reason）
 * - DC 对抗（difficultyClass + outcome）
 * - 场景标记（scene）
 */
"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function saveDiceRoll(
  campaignId: string,
  formula: string,
  result: number,
  details: string,
  scene?: string,
  characterId?: string,
  reason?: string,
  difficultyClass?: number,
  outcome?: string,
  rollType: string = "GENERAL",
) {
  const session = await auth();
  if (!session?.user) return null;

  return prisma.diceRoll.create({
    data: {
      formula,
      result,
      details,
      scene: scene || null,
      userId: session.user.id!,
      campaignId,
      characterId: characterId || null,
      reason: reason || null,
      difficultyClass: difficultyClass || null,
      outcome: outcome || null,
      rollType,
    },
    include: {
      character: { select: { name: true } },
    },
  });
}

/**
 * 获取当前战役的掷骰历史（最近 50 条，含角色信息）
 */
export async function getDiceHistory(campaignId: string) {
  return prisma.diceRoll.findMany({
    where: { campaignId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      character: { select: { name: true } },
    },
  });
}
