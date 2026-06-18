/**
 * GET /api/bot/dice/history — 获取掷骰历史
 *
 * 鉴权: Bearer API Key
 * Query: campaignId, userId?, platformId?, characterId?, scene?, page?, pageSize?
 *   platformId = QQ 号，会自动解析为 userId 并过滤
 */

import { NextRequest, NextResponse } from "next/server";
import { withBotAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const authError = await withBotAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get("campaignId");
    const userId = searchParams.get("userId");
    const platformId = searchParams.get("platformId");
    const characterId = searchParams.get("characterId");
    const scene = searchParams.get("scene");
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "20"), 100);

    if (!campaignId) {
      return NextResponse.json(
        { error: "缺少参数: campaignId" },
        { status: 400 }
      );
    }

    const where: any = { campaignId };

    // 如果传了 platformId（QQ号），通过 BotBinding 解析 userId
    if (platformId) {
      const binding = await prisma.botBinding.findUnique({
        where: { platform_platformId: { platform: "qq", platformId } },
        select: { userId: true },
      });
      if (binding) {
        where.userId = binding.userId;
      } else {
        return NextResponse.json({ rolls: [], total: 0, page, pageSize });
      }
    } else if (userId) {
      // 先检查是否合法用户 ID
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (user) {
        where.userId = userId;
      } else {
        // 尝试用 BotBinding 解析（兼容传 QQ 号的情况）
        const binding = await prisma.botBinding.findUnique({
          where: { platform_platformId: { platform: "qq", platformId: userId } },
          select: { userId: true },
        });
        if (binding) {
          where.userId = binding.userId;
        }
      }
    }

    if (characterId) where.characterId = characterId;
    if (scene) where.scene = scene;

    const [rolls, total] = await Promise.all([
      prisma.diceRoll.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: pageSize,
        skip: (page - 1) * pageSize,
        include: {
          character: { select: { name: true } },
        },
      }),
      prisma.diceRoll.count({ where }),
    ]);

    return NextResponse.json({ rolls, total, page, pageSize });
  } catch (error) {
    console.error("骰子历史 API 错误:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
