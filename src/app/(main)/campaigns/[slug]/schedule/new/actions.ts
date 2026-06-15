"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createScheduleEvent(campaignSlug: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const title = formData.get("title") as string;
  const scheduledAt = formData.get("scheduledAt") as string;
  const location = formData.get("location") as string | null;
  const notes = formData.get("notes") as string | null;
  if (!title || !scheduledAt) throw new Error("Required");
  const campaign = await prisma.campaign.findUnique({ where: { slug: campaignSlug }, select: { id: true } });
  if (!campaign) throw new Error("Not found");
  await prisma.scheduleEvent.create({
    data: { title, scheduledAt: new Date(scheduledAt), location, notes, campaignId: campaign.id, createdById: session.user.id },
  });
  revalidatePath(`/campaigns/${campaignSlug}/schedule`);
  redirect(`/campaigns/${campaignSlug}/schedule`);
}