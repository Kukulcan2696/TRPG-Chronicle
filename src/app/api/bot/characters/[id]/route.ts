/**
 * GET /api/bot/characters/[id] — 查询单个角色详情
 *
 * 鉴权: Bearer API Key
 */

import { NextRequest, NextResponse } from "next/server";
import { withBotAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await withBotAuth(req);
  if (authError) return authError;

  try {
    const { id } = await params;

    const character = await prisma.character.findUnique({
      where: { id },
      include: {
        player: { select: { id: true, name: true } },
        campaign: { select: { id: true, title: true } },
      },
    });

    if (!character) {
      return NextResponse.json({ error: "角色不存在" }, { status: 404 });
    }

    return NextResponse.json(character);
  } catch (error) {
    console.error("角色详情 API 错误:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

/**
 * PATCH /api/bot/characters/[id] — 更新角色
 * Body: { name?, bio?, status?, sheetData? }
 * sheetData 为对象时深度合并到现有数据
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await withBotAuth(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    const { name, bio, status, sheetData } = await req.json();

    const character = await prisma.character.findUnique({ where: { id } });
    if (!character) {
      return NextResponse.json({ error: "角色不存在" }, { status: 404 });
    }

    // 构建更新数据
    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio || null;
    if (status !== undefined) {
      if (!["DRAFT", "COMPLETE", "APPROVED"].includes(status)) {
        return NextResponse.json({ error: "无效的状态" }, { status: 400 });
      }
      updateData.status = status;
    }

    // sheetData 深度合并
    if (sheetData !== undefined && typeof sheetData === "object") {
      const existing = JSON.parse(character.sheetData || "{}");
      const merged = { ...existing, ...sheetData };
      updateData.sheetData = JSON.stringify(merged);
    }

    const updated = await prisma.character.update({
      where: { id },
      data: updateData,
      include: {
        player: { select: { id: true, name: true } },
        campaign: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("角色更新 API 错误:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

/**
 * DELETE /api/bot/characters/[id] — 删除角色
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await withBotAuth(req);
  if (authError) return authError;

  try {
    const { id } = await params;

    const character = await prisma.character.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!character) {
      return NextResponse.json({ error: "角色不存在" }, { status: 404 });
    }

    await prisma.character.delete({ where: { id } });

    return NextResponse.json({ success: true, deleted: character.name });
  } catch (error) {
    console.error("角色删除 API 错误:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
