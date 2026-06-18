/**
 * GET /api/bot/characters — 查询角色列表/搜索
 *
 * 鉴权: Bearer API Key
 * Query: campaignId, name?, playerId?, platformId?
 *   platformId = QQ 号，通过 BotBinding 查找该 QQ 绑定的角色
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
    const platformId = searchParams.get("platformId");

    if (!campaignId) {
      return NextResponse.json(
        { error: "缺少参数: campaignId" },
        { status: 400 }
      );
    }

    const where: any = { campaignId };
    if (name) where.name = { contains: name };

    // 若传入 platformId（QQ号），通过 BotBinding 解析
    if (platformId) {
      const binding = await prisma.botBinding.findUnique({
        where: { platform_platformId: { platform: "qq", platformId } },
        select: { userId: true, characterId: true },
      });
      if (binding) {
        // 如果绑定中有 characterId，直接查该角色
        if (binding.characterId) {
          where.id = binding.characterId;
        } else {
          // 否则查该用户在此战役中的所有角色
          where.playerId = binding.userId;
        }
      } else {
        // 无绑定则返回空
        return NextResponse.json({ characters: [], bound: false });
      }
    } else if (playerId) {
      where.playerId = playerId;
    }

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
        status: true,
        playerId: true,
        player: { select: { name: true } },
      },
    });

    // 标记哪些是该 QQ 绑定的角色
    const boundCharacterId = platformId
      ? (await prisma.botBinding.findUnique({
          where: { platform_platformId: { platform: "qq", platformId } },
          select: { characterId: true },
        }))?.characterId
      : null;

    return NextResponse.json({
      characters,
      boundCharacterId, // 前端/Bot 可据此高亮"我的角色"
    });
  } catch (error) {
    console.error("角色 API 错误:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

/**
 * POST /api/bot/characters — 创建角色
 * Body: { name, campaignId, playerId, system?, bio? }
 */
export async function POST(req: NextRequest) {
  const authError = await withBotAuth(req);
  if (authError) return authError;

  try {
    const { name, campaignId, playerId, system, bio } = await req.json();

    if (!name || !campaignId || !playerId) {
      return NextResponse.json(
        { error: "缺少必要参数: name, campaignId, playerId" },
        { status: 400 }
      );
    }

    // 解析 playerId：可能是平台用户 ID 或 QQ 号
    let resolvedPlayerId: string | null = null;
    const user = await prisma.user.findUnique({
      where: { id: playerId },
      select: { id: true },
    });
    if (user) {
      resolvedPlayerId = playerId;
    } else {
      const binding = await prisma.botBinding.findUnique({
        where: { platform_platformId: { platform: "qq", platformId: playerId } },
        select: { userId: true },
      });
      resolvedPlayerId = binding?.userId ?? null;
    }

    if (!resolvedPlayerId) {
      return NextResponse.json(
        { error: "用户不存在或未绑定 QQ" },
        { status: 400 }
      );
    }

    const character = await prisma.character.create({
      data: {
        name,
        campaignId,
        playerId: resolvedPlayerId,
        system: system || "CUSTOM",
        bio: bio || null,
      },
    });

    return NextResponse.json(character, { status: 201 });
  } catch (error) {
    console.error("角色创建 API 错误:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
