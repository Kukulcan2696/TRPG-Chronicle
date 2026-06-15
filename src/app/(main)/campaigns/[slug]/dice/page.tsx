/**
 * 骰子页面服务端外壳
 * 
 * 从 params 获取 slug → 查数据库得 campaignId → 传给客户端 DiceRoller
 */
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DiceRoller } from "./dice-roller";

interface PageProps { params: Promise<{ slug: string }> }

export default async function DicePage({ params }: PageProps) {
  const { slug } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { slug },
    select: { id: true, title: true },
  });
  if (!campaign) notFound();

  return <DiceRoller campaignId={campaign.id} campaignTitle={campaign.title} />;
}