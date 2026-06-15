"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { markdownToExcerpt } from "@/lib/markdown";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updatePost(
  campaignSlug: string,
  postId: string,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post || post.authorId !== session.user.id) throw new Error("Forbidden");

  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const content = formData.get("content") as string;
  const sessionNumber = formData.get("sessionNumber")
    ? parseInt(formData.get("sessionNumber") as string)
    : null;
  const gameDateStr = formData.get("gameDate") as string;
  const published = formData.get("published") === "true";

  await prisma.post.update({
    where: { id: postId },
    data: {
      title,
      slug,
      content,
      excerpt: markdownToExcerpt(content),
      sessionNumber,
      gameDate: gameDateStr ? new Date(gameDateStr) : null,
      published,
    },
  });

  revalidatePath(`/campaigns/${campaignSlug}/posts`);
  redirect(`/campaigns/${campaignSlug}/posts/${slug}`);
}

export async function deletePost(campaignSlug: string, postId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post || post.authorId !== session.user.id) throw new Error("Forbidden");

  await prisma.post.delete({ where: { id: postId } });

  revalidatePath(`/campaigns/${campaignSlug}/posts`);
  redirect(`/campaigns/${campaignSlug}/posts`);
}