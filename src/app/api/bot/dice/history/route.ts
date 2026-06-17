/**
 * GET /api/bot/dice/history — 获取掷骰历史
 *
 * 鉴权: Bearer API Key
 * Query: campaignId, userId?, limit?, scene?
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
    const scene = searchParams.get("scene");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    if (!campaignId) {
      return NextResponse.json(
        { error: "缺少参数: campaignId" },
        { status: 400 }
      );
    }

    const where: any = { campaignId };
    if (userId) where.userId = userId;
    if (scene) where.scene = scene;

    const [rolls, total] = await Promise.all([
      prisma.diceRoll.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.diceRoll.count({ where }),
    ]);

    return NextResponse.json({ rolls, total });
  } catch (error) {
    console.error("骰子历史 API 错误:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
