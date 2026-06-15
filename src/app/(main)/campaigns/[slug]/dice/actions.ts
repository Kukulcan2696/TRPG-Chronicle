/**
 * 骰子 Server Actions
 * 
 * 掷骰结果按战役隔离存储，支持场景标记。
 */
"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * 保存一次掷骰
 * @param campaignId 战役 ID
 * @param formula 骰子公式，如 "d20", "2d6+3"
 * @param result 最终结果
 * @param details 详细信息，如 "[5, 3] + 2 = 10"
 * @param scene 场景标记，如 "战斗·地精伏击"
 */
export async function saveDiceRoll(
  campaignId: string,
  formula: string,
  result: number,
  details: string,
  scene?: string,
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
    },
  });
}

/**
 * 获取当前战役的掷骰历史（最近 50 条）
 */
export async function getDiceHistory(campaignId: string) {
  return prisma.diceRoll.findMany({
    where: { campaignId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}