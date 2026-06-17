/**
 * POST /api/bot/posts — 快速创建战报记录
 *
 * 鉴权: Bearer API Key
 * Body: { campaignId, title, content, userId, sessionNumber?, published? }
 */

import { NextRequest, NextResponse } from "next/server";
import { withBotAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { markdownToExcerpt } from "@/lib/markdown";

export async function POST(req: NextRequest) {
  const authError = await withBotAuth(req);
  if (authError) return authError;

  try {
    const { campaignId, title, content, userId, sessionNumber, published } =
      await req.json();

    if (!campaignId || !title || !content) {
      return NextResponse.json(
        { error: "缺少必要参数: campaignId, title, content" },
        { status: 400 }
      );
    }

    // 校验 authorId（若提供）：查 BotBinding 或验证 User 是否存在
    let resolvedAuthorId: string | null = null;
    const authorId = userId; // body 中字段名为 userId
    if (authorId) {
      const user = await prisma.user.findUnique({
        where: { id: authorId },
        select: { id: true },
      });
      if (user) {
        resolvedAuthorId = authorId;
      } else {
        const binding = await prisma.botBinding.findUnique({
          where: { platform_platformId: { platform: "qq", platformId: authorId } },
          select: { userId: true },
        });
        resolvedAuthorId = binding?.userId ?? null;
      }
    }

    // 生成 slug：基于标题 + 时间戳后 6 位
    const timestamp = Date.now().toString(36);
    const slugBase = title
      .replace(/[^a-zA-Z0-9一-鿿]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40)
      .toLowerCase();
    const slug = slugBase
      ? `${slugBase}-${timestamp}`
      : `post-${timestamp}`;

    const excerpt = markdownToExcerpt(content, 150);

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        campaignId,
        authorId: resolvedAuthorId,
        sessionNumber: sessionNumber || null,
        published: published ?? false,
      },
    });

    return NextResponse.json(
      {
        id: post.id,
        slug: post.slug,
        title: post.title,
        createdAt: post.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("战报创建 API 错误:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
