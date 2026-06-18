"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * DM 批准角色
 */
export async function approveCharacter(charId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const character = await prisma.character.findUnique({
    where: { id: charId },
    include: { campaign: { select: { dmId: true } } },
  });
  if (!character) throw new Error("角色不存在");
  if (character.campaign.dmId !== session.user.id) throw new Error("仅 DM 可批准角色");

  await prisma.character.update({
    where: { id: charId },
    data: { status: "APPROVED" },
  });
}
