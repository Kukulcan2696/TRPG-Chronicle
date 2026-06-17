/**
 * GET /api/bot/campaign — 查询战役信息 + 统计
 *
 * 鉴权: Bearer API Key
 * Query: campaignId
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

    if (!campaignId) {
      return NextResponse.json(
        { error: "缺少参数: campaignId" },
        { status: 400 }
      );
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        coverImage: true,
        dm: { select: { id: true, name: true } },
        _count: {
          select: {
            members: true,
            posts: true,
            characters: true,
            worldEntries: true,
            diceRolls: true,
            scheduleEvents: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "战役不存在" }, { status: 404 });
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("战役 API 错误:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
