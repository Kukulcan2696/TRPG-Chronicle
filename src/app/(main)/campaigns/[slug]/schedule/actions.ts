"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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