"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createCharacter(
  campaignSlug: string,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const system = formData.get("system") as string;
  const bio = formData.get("bio") as string | null;
  const isPublic = formData.get("isPublic") === "true";

  if (!name) throw new Error("角色名称不能为空");

  const campaign = await prisma.campaign.findUnique({
    where: { slug: campaignSlug },
    select: { id: true },
  });
  if (!campaign) throw new Error("战役不存在");

  // Build sheetData from form fields
  const sheetData: Record<string, any> = {};
  for (const [key, value] of formData.entries()) {
    if (!["name", "system", "bio", "isPublic"].includes(key)) {
      sheetData[key] = value;
    }
  }

  const character = await prisma.character.create({
    data: {
      name,
      system,
      sheetData: JSON.stringify(sheetData),
      campaignId: campaign.id,
      playerId: session.user.id,
      bio,
      isPublic,
    },
  });

  revalidatePath(`/campaigns/${campaignSlug}/characters`);
  redirect(`/campaigns/${campaignSlug}/characters/${character.id}`);
}