/**
 * 战役编辑/删除 Server Actions（仅 DM 可操作）
 * 
 * 安全校验：
 * - 仅 DM（campaign.dmId === session.user.id）可编辑/删除
 * - coverImage 通过隐藏 input 从 ImageUpload 组件传入
 */
"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * 更新战役信息（标题、简介、封面图）
 */
export async function updateCampaign(slug: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const campaign = await prisma.campaign.findUnique({ where: { slug } });
  if (!campaign || campaign.dmId !== session.user.id) throw new Error("Forbidden");

  // 提取封面图 URL（空字符串表示移除封面）
  const coverImage = (formData.get("coverImage") as string) || null;

  await prisma.campaign.update({
    where: { slug },
    data: {
      title: formData.get("title") as string,
      description: formData.get("description") as string | null,
      coverImage,
    },
  });

  revalidatePath(`/campaigns/${slug}`);
  redirect(`/campaigns/${slug}`);
}

/**
 * 删除战役（级联删除所有关联数据）
 */
export async function deleteCampaign(slug: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const campaign = await prisma.campaign.findUnique({ where: { slug } });
  if (!campaign || campaign.dmId !== session.user.id) throw new Error("Forbidden");

  // Prisma schema 设置了 onDelete: Cascade，会自动删除关联数据
  await prisma.campaign.delete({ where: { slug } });

  revalidatePath("/campaigns");
  redirect("/campaigns");
}