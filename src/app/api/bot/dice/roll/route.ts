/**
 * POST /api/bot/dice/roll — 掷骰并持久化
 *
 * 鉴权: Bearer API Key
 * Body: { formula, campaignId, userId, scene? }
 */

import { NextRequest, NextResponse } from "next/server";
import { withBotAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { rollDice, isValidDiceFormula } from "@/lib/dice";

export async function POST(req: NextRequest) {
  const authError = await withBotAuth(req);
  if (authError) return authError;

  try {
    const { formula, campaignId, userId, scene } = await req.json();

    if (!formula || !campaignId) {
      return NextResponse.json(
        { error: "缺少必要参数: formula, campaignId" },
        { status: 400 }
      );
    }

    // 校验 userId（若提供）：查 BotBinding 或验证 User 是否存在
    // 未绑定 QQ 用户也能掷骰，记录不关联平台用户
    let resolvedUserId: string | null = null;
    if (userId) {
      // 先检查是否为合法平台用户 ID
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (user) {
        resolvedUserId = userId;
      } else {
        // userId 可能是 QQ 号，尝试通过 BotBinding 查找
        const binding = await prisma.botBinding.findUnique({
          where: { platform_platformId: { platform: "qq", platformId: userId } },
          select: { userId: true },
        });
        resolvedUserId = binding?.userId ?? null;
      }
    }

    if (!isValidDiceFormula(formula)) {
      return NextResponse.json({ error: "无效的骰子公式" }, { status: 400 });
    }

    // 验证战役存在
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true },
    });
    if (!campaign) {
      return NextResponse.json({ error: "战役不存在" }, { status: 404 });
    }

    const { result, details } = rollDice(formula);

    const diceRoll = await prisma.diceRoll.create({
      data: {
        formula,
        result,
        details,
        scene: scene || null,
        campaignId,
        userId: resolvedUserId,
      },
    });

    return NextResponse.json(diceRoll, { status: 201 });
  } catch (error) {
    console.error("骰子 API 错误:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
