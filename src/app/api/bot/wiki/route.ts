/**
 * GET /api/bot/wiki — 查询百科条目
 *
 * 鉴权: Bearer API Key
 * Query: campaignId, q?, type?
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
    const q = searchParams.get("q");
    const entryType = searchParams.get("type");

    if (!campaignId) {
      return NextResponse.json(
        { error: "缺少参数: campaignId" },
        { status: 400 }
      );
    }

    const where: any = { campaignId };
    if (entryType) where.type = entryType;
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { content: { contains: q } },
      ];
    }

    const entries = await prisma.worldEntry.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        type: true,
        slug: true,
        content: true,
        imageUrl: true,
        parentId: true,
        author: { select: { name: true } },
      },
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("百科 API 错误:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
