"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addTimelineEvent(campaignSlug: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const gameDate = formData.get("gameDate") as string;
  if (!title || !gameDate) throw new Error("Required");

  const campaign = await prisma.campaign.findUnique({ where: { slug: campaignSlug }, select: { id: true } });
  if (!campaign) throw new Error("Not found");

  const maxOrder = await prisma.timelineEvent.findFirst({
    where: { campaignId: campaign.id },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.timelineEvent.create({
    data: {
      title, description, gameDate,
      campaignId: campaign.id,
      order: (maxOrder?.order ?? 0) + 1,
    },
  });

  revalidatePath(`/campaigns/${campaignSlug}/timeline`);
}