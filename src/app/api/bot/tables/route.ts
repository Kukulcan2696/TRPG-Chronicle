/**
 * GET /api/bot/tables — 查询随机表列表
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

    const tables = await prisma.randomTable.findMany({
      where: { campaignId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        author: { select: { name: true } },
      },
    });

    return NextResponse.json({ tables });
  } catch (error) {
    console.error("随机表列表 API 错误:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
