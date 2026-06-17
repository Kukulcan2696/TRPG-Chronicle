/**
 * POST /api/bot/tables/roll — 掷随机表
 *
 * 鉴权: Bearer API Key
 * Body: { tableId }
 */

import { NextRequest, NextResponse } from "next/server";
import { withBotAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const authError = await withBotAuth(req);
  if (authError) return authError;

  try {
    const { tableId } = await req.json();

    if (!tableId) {
      return NextResponse.json(
        { error: "缺少参数: tableId" },
        { status: 400 }
      );
    }

    const table = await prisma.randomTable.findUnique({
      where: { id: tableId },
      select: { title: true, tableData: true },
    });

    if (!table) {
      return NextResponse.json({ error: "随机表不存在" }, { status: 404 });
    }

    let entries: { range: string; result: string }[];
    try {
      entries = JSON.parse(table.tableData);
    } catch {
      return NextResponse.json(
        { error: "随机表数据解析失败" },
        { status: 500 }
      );
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json(
        { error: "随机表为空" },
        { status: 400 }
      );
    }

    const idx = Math.floor(Math.random() * entries.length);
    const rolled = entries[idx];

    return NextResponse.json({
      tableTitle: table.title,
      rolled,
      allEntries: entries,
    });
  } catch (error) {
    console.error("随机表掷骰 API 错误:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
