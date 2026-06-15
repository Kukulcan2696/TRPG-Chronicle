/**
 * 创建百科条目 Server Action
 */
"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createWikiEntry(campaignSlug: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const type = formData.get("type") as string;
  const content = formData.get("content") as string;
  const campaign = await prisma.campaign.findUnique({ where: { slug: campaignSlug }, select: { id: true } });
  if (!campaign) throw new Error("Not found");
  const entry = await prisma.worldEntry.create({
    data: { title, slug, type, content, campaignId: campaign.id, authorId: session.user.id },
  });
  revalidatePath(`/campaigns/${campaignSlug}/wiki`);
  redirect(`/campaigns/${campaignSlug}/wiki/${entry.id}`);
}