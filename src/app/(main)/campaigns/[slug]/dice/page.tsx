/**
 * 骰子页面服务端外壳
 *
 * 从 params 获取 slug → 查数据库得 campaignId + 用户角色 → 传给客户端 DiceRoller
 */
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DiceRoller } from "./dice-roller";

interface PageProps { params: Promise<{ slug: string }> }

export default async function DicePage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth();

  const campaign = await prisma.campaign.findUnique({
    where: { slug },
    select: { id: true, title: true },
  });
  if (!campaign) notFound();

  // 获取当前用户在该战役的角色列表
  const characters = session?.user?.id
    ? await prisma.character.findMany({
        where: { campaignId: campaign.id, playerId: session.user.id },
        select: { id: true, name: true },
        orderBy: { createdAt: "asc" },
      })
    : [];

  return (
    <DiceRoller
      campaignId={campaign.id}
      campaignTitle={campaign.title}
      characters={characters}
    />
  );
}