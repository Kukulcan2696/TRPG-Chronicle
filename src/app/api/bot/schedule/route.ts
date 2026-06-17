/**
 * GET /api/bot/schedule — 查询排期
 *
 * 鉴权: Bearer API Key
 * Query: campaignId, upcoming? (默认 true)
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
    const upcoming = searchParams.get("upcoming") !== "false";

    if (!campaignId) {
      return NextResponse.json(
        { error: "缺少参数: campaignId" },
        { status: 400 }
      );
    }

    const where: any = { campaignId };
    if (upcoming) {
      where.scheduledAt = { gte: new Date() };
    }

    const events = await prisma.scheduleEvent.findMany({
      where,
      orderBy: { scheduledAt: "asc" },
      take: 10,
      include: {
        creator: { select: { name: true } },
        rsvps: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("排期 API 错误:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
