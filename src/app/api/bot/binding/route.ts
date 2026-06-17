/**
 * GET  /api/bot/binding — 查询 QQ 号绑定
 * POST /api/bot/binding — 设置 QQ 号绑定
 *
 * 鉴权: Bearer API Key
 * GET  Query: platformId
 * POST Body: { platformId, userId }
 */

import { NextRequest, NextResponse } from "next/server";
import { withBotAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const authError = await withBotAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const platformId = searchParams.get("platformId");

    if (!platformId) {
      return NextResponse.json(
        { error: "缺少参数: platformId" },
        { status: 400 }
      );
    }

    const binding = await prisma.botBinding.findUnique({
      where: { platform_platformId: { platform: "qq", platformId } },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!binding) {
      return NextResponse.json({ bound: false });
    }

    return NextResponse.json({
      bound: true,
      userId: binding.userId,
      user: binding.user,
    });
  } catch (error) {
    console.error("用户绑定查询 API 错误:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = await withBotAuth(req);
  if (authError) return authError;

  try {
    const { platformId, userId } = await req.json();

    if (!platformId || !userId) {
      return NextResponse.json(
        { error: "缺少必要参数: platformId, userId" },
        { status: 400 }
      );
    }

    // 验证用户存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const binding = await prisma.botBinding.upsert({
      where: { platform_platformId: { platform: "qq", platformId } },
      update: { userId },
      create: { platform: "qq", platformId, userId },
    });

    return NextResponse.json({ success: true, binding });
  } catch (error) {
    console.error("用户绑定 API 错误:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
