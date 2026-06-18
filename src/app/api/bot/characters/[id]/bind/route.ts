/**
 * POST /api/bot/characters/[id]/bind — 绑定 QQ 到角色
 *
 * 鉴权: Bearer API Key
 * Body: { platformId }  // QQ 号
 */
import { NextRequest, NextResponse } from "next/server";
import { withBotAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await withBotAuth(req);
  if (authError) return authError;

  try {
    const { id: charId } = await params;
    const { platformId } = await req.json();

    if (!platformId) {
      return NextResponse.json({ error: "缺少参数: platformId" }, { status: 400 });
    }

    // 验证角色存在
    const character = await prisma.character.findUnique({
      where: { id: charId },
      select: { id: true, name: true, playerId: true },
    });
    if (!character) {
      return NextResponse.json({ error: "角色不存在" }, { status: 404 });
    }

    // 检查该 QQ 是否已绑定到其他角色
    const existingBinding = await prisma.botBinding.findUnique({
      where: { platform_platformId: { platform: "qq", platformId } },
      select: { characterId: true, character: { select: { name: true } } },
    });
    if (existingBinding?.characterId && existingBinding.characterId !== charId) {
      return NextResponse.json(
        { error: `该 QQ 已绑定到角色「${existingBinding.character?.name || "?"}」` },
        { status: 409 }
      );
    }

    // 查找或创建绑定
    const binding = await prisma.botBinding.upsert({
      where: { platform_platformId: { platform: "qq", platformId } },
      update: { characterId: charId, userId: character.playerId },
      create: {
        platform: "qq",
        platformId,
        userId: character.playerId,
        characterId: charId,
      },
    });

    return NextResponse.json({ success: true, binding, character: character.name });
  } catch (error) {
    console.error("角色绑定 API 错误:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
