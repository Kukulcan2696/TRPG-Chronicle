/**
 * POST /api/bot/timeline — 添加时间线事件
 *
 * 鉴权: Bearer API Key
 * Body: { campaignId, title, gameDate, description? }
 */

import { NextRequest, NextResponse } from "next/server";
import { withBotAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const authError = await withBotAuth(req);
  if (authError) return authError;

  try {
    const { campaignId, title, gameDate, description } = await req.json();

    if (!campaignId || !title || !gameDate) {
      return NextResponse.json(
        { error: "缺少必要参数: campaignId, title, gameDate" },
        { status: 400 }
      );
    }

    // 计算 order（当前最大 + 1）
    const maxOrder = await prisma.timelineEvent.aggregate({
      where: { campaignId },
      _max: { order: true },
    });
    const order = (maxOrder._max.order || 0) + 1;

    const event = await prisma.timelineEvent.create({
      data: {
        title,
        description: description || null,
        gameDate,
        campaignId,
        order,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("时间线 API 错误:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
