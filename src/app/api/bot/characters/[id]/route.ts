/**
 * GET /api/bot/characters/[id] — 查询单个角色详情
 *
 * 鉴权: Bearer API Key
 */

import { NextRequest, NextResponse } from "next/server";
import { withBotAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await withBotAuth(req);
  if (authError) return authError;

  try {
    const { id } = await params;

    const character = await prisma.character.findUnique({
      where: { id },
      include: {
        player: { select: { id: true, name: true } },
        campaign: { select: { id: true, title: true } },
      },
    });

    if (!character) {
      return NextResponse.json({ error: "角色不存在" }, { status: 404 });
    }

    return NextResponse.json(character);
  } catch (error) {
    console.error("角色详情 API 错误:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
