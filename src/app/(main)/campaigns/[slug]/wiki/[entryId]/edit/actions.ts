/**
 * Wiki 条目编辑/删除 Server Actions
 */
"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateWikiEntry(campaignSlug: string, entryId: string, formData: FormData) {
  const session = await auth(); if (!session?.user) throw new Error("Unauthorized");
  const entry = await prisma.worldEntry.findUnique({ where: { id: entryId } });
  if (!entry || entry.authorId !== session.user.id) throw new Error("Forbidden");
  await prisma.worldEntry.update({ where: { id: entryId }, data: { title: formData.get("title") as string, content: formData.get("content") as string, type: formData.get("type") as string } });
  revalidatePath(`/campaigns/${campaignSlug}/wiki`);
  redirect(`/campaigns/${campaignSlug}/wiki/${entryId}`);
}
export async function deleteWikiEntry(campaignSlug: string, entryId: string) {
  const session = await auth(); if (!session?.user) throw new Error("Unauthorized");
  const entry = await prisma.worldEntry.findUnique({ where: { id: entryId } });
  if (!entry || entry.authorId !== session.user.id) throw new Error("Forbidden");
  await prisma.worldEntry.delete({ where: { id: entryId } });
  revalidatePath(`/campaigns/${campaignSlug}/wiki`);
  redirect(`/campaigns/${campaignSlug}/wiki`);
}