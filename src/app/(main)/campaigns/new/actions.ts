"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createCampaign(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string | null;

  if (!title || !slug) throw new Error("Title and slug are required");

  await prisma.campaign.create({
    data: {
      title,
      slug,
      description,
      dmId: session.user.id,
      members: {
        create: { userId: session.user.id, role: "DM" },
      },
    },
  });

  revalidatePath("/campaigns");
  redirect(`/campaigns/${slug}`);
}