/**
 * 创建角色 Server Action
 * 
 * 功能：
 * - 解析表单字段：name, system, bio, isPublic, portrait
 * - 收集所有 sheet_ 前缀字段合并到 sheetData JSON
 * - 写入 prisma.character 表
 * 
 * 安全：
 * - 校验用户已登录
 * - 校验战役存在
 * - 角色绑定到当前用户（playerId）
 */
"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createCharacter(campaignSlug: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // 提取基本字段
  const name = formData.get("name") as string;
  const system = formData.get("system") as string;
  const bio = formData.get("bio") as string | null;
  const isPublic = formData.get("isPublic") === "true";
  // 头像 URL（来自 ImageUpload 组件 + 隐藏 input）
  const portrait = (formData.get("portrait") as string) || null;

  // 校验战役存在
  const campaign = await prisma.campaign.findUnique({
    where: { slug: campaignSlug },
    select: { id: true },
  });
  if (!campaign) throw new Error("战役不存在");

  // 收集所有自定义字段到 JSON（去掉 field_ 前缀）
  const sheetData: Record<string, any> = {};
  const topKeys = ["name", "system", "bio", "isPublic", "portrait", "status"];
  for (const [key, value] of formData.entries()) {
    if (!topKeys.includes(key)) {
      // 去掉 field_ 前缀，兼容旧数据的 sheet_ 前缀
      const cleanKey = key.startsWith("field_") ? key.slice(6)
        : key.startsWith("sheet_") ? key.slice(6)
        : key;
      sheetData[cleanKey] = value;
    }
  }

  // 创建角色记录
  const character = await prisma.character.create({
    data: {
      name,
      system,
      sheetData: JSON.stringify(sheetData),
      campaignId: campaign.id,
      playerId: session.user.id,
      bio,
      isPublic,
      portrait,
    },
  });

  // 重新验证角色列表缓存 → 跳转到角色详情页
  revalidatePath(`/campaigns/${campaignSlug}/characters`);
  redirect(`/campaigns/${campaignSlug}/characters/${character.id}`);
}