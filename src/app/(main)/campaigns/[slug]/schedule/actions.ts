"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";;

export async function rsvpEvent(
  campaignSlug: string,
  eventId: string,
  status: "GOING" | "MAYBE" | "CANT",
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.scheduleRSVP.upsert({
    where: {
      scheduleEventId_userId: {
        scheduleEventId: eventId,
        userId: session.user.id,
      },
    },
    create: {
      scheduleEventId: eventId,
      userId: session.user.id,
      status,
    },
    update: { status },
  });

  revalidatePath(`/campaigns/${campaignSlug}/schedule`);
}
/** 删除排期场次（仅 DM） */
export async function deleteScheduleEvent(campaignSlug: string, eventId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const event = await prisma.scheduleEvent.findUnique({ where: { id: eventId }, select: { campaign: { select: { dmId: true } } } });
  if (!event || event.campaign.dmId !== session.user.id) throw new Error("Forbidden");
  await prisma.scheduleEvent.delete({ where: { id: eventId } });
  revalidatePath(`/campaigns/${campaignSlug}/schedule`);
}
/**
 * 编辑排期场次（仅 DM）
 */
export async function updateScheduleEvent(campaignSlug: string, eventId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const event = await prisma.scheduleEvent.findUnique({ where: { id: eventId }, select: { campaign: { select: { dmId: true } } } });
  if (!event || event.campaign.dmId !== session.user.id) throw new Error("Forbidden");

  const title = formData.get("title") as string;
  const scheduledAt = formData.get("scheduledAt") as string;
  const location = formData.get("location") as string | null;
  const notes = formData.get("notes") as string | null;

  await prisma.scheduleEvent.update({
    where: { id: eventId },
    data: { title, scheduledAt: new Date(scheduledAt), location, notes },
  });
  revalidatePath(`/campaigns/${campaignSlug}/schedule`);
  redirect(`/campaigns/${campaignSlug}/schedule`);
}