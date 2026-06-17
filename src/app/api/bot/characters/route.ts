/**
 * GET /api/bot/characters — 查询角色列表/搜索
 *
 * 鉴权: Bearer API Key
 * Query: campaignId, name?, playerId?
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
    const name = searchParams.get("name");
    const playerId = searchParams.get("playerId");

    if (!campaignId) {
      return NextResponse.json(
        { error: "缺少参数: campaignId" },
        { status: 400 }
      );
    }

    const where: any = { campaignId };
    if (name) where.name = { contains: name };
    if (playerId) where.playerId = playerId;

    const characters = await prisma.character.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        name: true,
        system: true,
        portrait: true,
        bio: true,
        playerId: true,
        player: { select: { name: true } },
      },
    });

    return NextResponse.json({ characters });
  } catch (error) {
    console.error("角色 API 错误:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
