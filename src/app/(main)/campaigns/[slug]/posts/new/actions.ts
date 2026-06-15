"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { markdownToExcerpt } from "@/lib/markdown";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPost(
  campaignSlug: string,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const content = formData.get("content") as string;
  const sessionNumber = formData.get("sessionNumber")
    ? parseInt(formData.get("sessionNumber") as string)
    : null;
  const gameDateStr = formData.get("gameDate") as string;
  const published = formData.get("published") === "true";

  if (!title || !slug || !content) {
    throw new Error("标题、URL标识和内容不能为空");
  }

  const campaign = await prisma.campaign.findUnique({
    where: { slug: campaignSlug },
    select: { id: true },
  });
  if (!campaign) throw new Error("战役不存在");

  await prisma.post.create({
    data: {
      title,
      slug,
      content,
      excerpt: markdownToExcerpt(content),
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