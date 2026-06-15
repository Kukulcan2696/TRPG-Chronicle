/**
 * 创建战报 Server Action
 * 
 * 与创建战役的模式相同：auth → 读表单 → prisma.create → 跳转
 * 
 * markdownToExcerpt: 从正文自动生成摘要，显示在卡片预览中
 * .bind(null, campaignSlug): Server Action 支持 bind 传额外参数
 *   表单在客户端用 createPost.bind(null, slug) 调用，
 *   这样服务端就知道是哪个战役
 */

"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { markdownToExcerpt } from "@/lib/markdown";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPost(campaignSlug: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const content = formData.get("content") as string;
  const sessionNumber = formData.get("sessionNumber") ? parseInt(formData.get("sessionNumber") as string) : null;
  const gameDateStr = formData.get("gameDate") as string;
  const published = formData.get("published") === "true";

  const campaign = await prisma.campaign.findUnique({ where: { slug: campaignSlug }, select: { id: true } });
  if (!campaign) throw new Error("战役不存在");

  await prisma.post.create({
    data: {
      title, slug, content,
      excerpt: markdownToExcerpt(content), // 自动生成摘要
      campaignId: campaign.id,
      sessionNumber,
      gameDate: gameDateStr ? new Date(gameDateStr) : null,
      authorId: session.user.id,
      published,
    },
  });

  revalidatePath(`/campaigns/${campaignSlug}/posts`);
  redirect(`/campaigns/${campaignSlug}/posts/${slug}`);
}