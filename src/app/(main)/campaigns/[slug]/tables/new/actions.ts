"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createRandomTable(campaignSlug: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const rawData = formData.get("tableData") as string;
  if (!title || !rawData) throw new Error("Required");

  const campaign = await prisma.campaign.findUnique({ where: { slug: campaignSlug }, select: { id: true } });
  if (!campaign) throw new Error("Not found");

  // Parse: each line is "diceRange | result"
  const entries = rawData.split("\n").filter(Boolean).map((line, i) => {
    const parts = line.split("|");
    return { range: (parts[0] || "").trim(), result: (parts[1] || "").trim() };
  });

  await prisma.randomTable.create({
    data: {
      title, description,
      campaignId: campaign.id,
      authorId: session.user.id,
      tableData: JSON.stringify(entries),
    },
  });

  revalidatePath(`/campaigns/${campaignSlug}/tables`);
  redirect(`/campaigns/${campaignSlug}/tables`);
}