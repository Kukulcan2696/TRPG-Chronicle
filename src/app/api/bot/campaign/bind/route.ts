/**
 * GET  /api/bot/campaign/bind — 查询 QQ 群绑定
 * POST /api/bot/campaign/bind — 设置 QQ 群绑定
 *
 * 鉴权: Bearer API Key
 * GET  Query: groupId
 * POST Body: { groupId, campaignId }
 */

import { NextRequest, NextResponse } from "next/server";
import { withBotAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const authError = await withBotAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");

    if (!groupId) {
      return NextResponse.json(
        { error: "缺少参数: groupId" },
        { status: 400 }
      );
    }

    const binding = await prisma.groupBinding.findUnique({
      where: { platform_groupId: { platform: "qq", groupId } },
      include: { campaign: { select: { id: true, title: true, slug: true } } },
    });

    if (!binding) {
      return NextResponse.json({ bound: false });
    }

    return NextResponse.json({ bound: true, campaignId: binding.campaignId, campaign: binding.campaign });
  } catch (error) {
    console.error("群绑定查询 API 错误:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = await withBotAuth(req);
  if (authError) return authError;

  try {
    const { groupId, campaignId, slug } = await req.json();

    if (!groupId) {
      return NextResponse.json(
        { error: "缺少必要参数: groupId 以及 campaignId 或 slug" },
        { status: 400 }
      );
    }

    // 通过 campaignId 或 slug 查找战役
    let campaign: { id: string } | null = null;
    if (campaignId) {
      campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { id: true },
      });
    } else if (slug) {
      campaign = await prisma.campaign.findUnique({
        where: { slug },
        select: { id: true },
      });
    } else {
      return NextResponse.json(
        { error: "缺少参数: campaignId 或 slug" },
        { status: 400 }
      );
    }

    if (!campaign) {
      return NextResponse.json({ error: "战役不存在" }, { status: 404 });
    }

    const binding = await prisma.groupBinding.upsert({
      where: { platform_groupId: { platform: "qq", groupId } },
      update: { campaignId: campaign.id },
      create: { platform: "qq", groupId, campaignId: campaign.id },
    });

    return NextResponse.json({ success: true, binding });
  } catch (error) {
    console.error("群绑定 API 错误:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

/**
 * DELETE /api/bot/campaign/bind — 解绑 QQ 群
 * Query: groupId
 */
export async function DELETE(req: NextRequest) {
  const authError = await withBotAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");

    if (!groupId) {
      return NextResponse.json({ error: "缺少参数: groupId" }, { status: 400 });
    }

    const binding = await prisma.groupBinding.findUnique({
      where: { platform_groupId: { platform: "qq", groupId } },
    });

    if (!binding) {
      return NextResponse.json({ error: "该群未绑定战役" }, { status: 404 });
    }

    await prisma.groupBinding.delete({
      where: { id: binding.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("群解绑 API 错误:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
