/**
 * POST /api/bot/schedule/rsvp — RSVP 回复排期
 *
 * 鉴权: Bearer API Key
 * Body: { scheduleEventId, userId, status }
 *   status: "GOING" | "MAYBE" | "CANT"
 */
import { NextRequest, NextResponse } from "next/server";
import { withBotAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const authError = await withBotAuth(req);
  if (authError) return authError;

  try {
    const { scheduleEventId, userId, status } = await req.json();

    if (!scheduleEventId || !userId || !status) {
      return NextResponse.json(
        { error: "缺少必要参数: scheduleEventId, userId, status" },
        { status: 400 }
      );
    }

    if (!["GOING", "MAYBE", "CANT"].includes(status)) {
      return NextResponse.json(
        { error: "status 必须是 GOING, MAYBE 或 CANT" },
        { status: 400 }
      );
    }

    // 验证事件存在
    const event = await prisma.scheduleEvent.findUnique({
      where: { id: scheduleEventId },
      select: { id: true, title: true },
    });
    if (!event) {
      return NextResponse.json({ error: "排期事件不存在" }, { status: 404 });
    }

    // 解析 userId：可能是平台用户 ID 或 QQ 号
    let resolvedUserId: string | null = null;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (user) {
      resolvedUserId = userId;
    } else {
      const binding = await prisma.botBinding.findUnique({
        where: { platform_platformId: { platform: "qq", platformId: userId } },
        select: { userId: true },
      });
      resolvedUserId = binding?.userId ?? null;
    }

    if (!resolvedUserId) {
      return NextResponse.json(
        { error: "用户不存在或未绑定 QQ" },
        { status: 400 }
      );
    }

    const rsvp = await prisma.scheduleRSVP.upsert({
      where: {
        scheduleEventId_userId: {
          scheduleEventId,
          userId: resolvedUserId,
        },
      },
      update: { status },
      create: { scheduleEventId, userId: resolvedUserId, status },
    });

    return NextResponse.json({ success: true, rsvp });
  } catch (error) {
    console.error("RSVP API 错误:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
