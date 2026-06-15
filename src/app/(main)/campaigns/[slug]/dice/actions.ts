/**
 * 骰子 Server Actions
 * 
 * 功能：
 * - saveDiceRoll: 保存一次掷骰结果到数据库
 * - getDiceHistory: 获取用户的掷骰历史
 * 
 * DiceRoll 表通过 userId 关联用户，通过 postId 可选关联战报。
 * 目前直接从战役骰子页面保存，不关联特定战报。
 */
"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * 保存一次掷骰
 * @param formula 骰子公式，如 "d20", "2d6+3"
 * @param result 最终结果
 * @param details 详细信息，如 "[5, 3] + 2 = 10"
 */
export async function saveDiceRoll(formula: string, result: number, details: string) {
  const session = await auth();
  if (!session?.user) return null;

  return prisma.diceRoll.create({
    data: {
      formula,
      result,
      details,
      userId: session.user.id!,
    },
  });
}

/**
 * 获取当前用户的掷骰历史（最近 50 条）
 */
export async function getDiceHistory() {
  const session = await auth();
  if (!session?.user) return [];

  return prisma.diceRoll.findMany({
    where: { userId: session.user.id! },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}