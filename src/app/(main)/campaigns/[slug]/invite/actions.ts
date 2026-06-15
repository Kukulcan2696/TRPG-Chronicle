/**
 * 战役邀请 Server Actions
 * 
 * 功能：
 * - generateInviteCode: 为战役生成/重新生成邀请码
 * - joinCampaign: 通过邀请码加入战役（成为 PLAYER 成员）
 */

"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";

/**
 * 生成 8 位随机邀请码
 * 只有 DM 可以生成
 */
export async function generateInviteCode(slug: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const campaign = await prisma.campaign.findUnique({ where: { slug } });
  if (!campaign || campaign.dmId !== session.user.id) throw new Error("Forbidden");

  // 生成 8 字符的十六进制随机码
  const code = randomBytes(4).toString("hex");

  await prisma.campaign.update({
    where: { slug },
    data: { inviteCode: code },
  });

  revalidatePath(`/campaigns/${slug}`);
  return code;
}

/**
 * 通过邀请码加入战役
 * 当前登录用户将被添加为 PLAYER 角色
 */
export async function joinCampaignByCode(code: string) {
  const session = await auth();
  if (!session?.user) throw new Error("请先登录");

  // 查找邀请码对应的战役
  const campaign = await prisma.campaign.findUnique({
    where: { inviteCode: code },
    select: { id: true, slug: true },
  });
  if (!campaign) throw new Error("无效的邀请码");

  // 检查是否已是成员
  const existing = await prisma.campaignMember.findUnique({
    where: { campaignId_userId: { campaignId: campaign.id, userId: session.user.id! } },
  });
  if (existing) {
    // 已是成员，直接跳转
    redirect(`/campaigns/${campaign.slug}`);
  }

  // 添加为 PLAYER 成员
  await prisma.campaignMember.create({
    data: {
      campaignId: campaign.id,
      userId: session.user.id!,
      role: "PLAYER",
    },
  });

  revalidatePath(`/campaigns/${campaign.slug}`);
  redirect(`/campaigns/${campaign.slug}`);
}