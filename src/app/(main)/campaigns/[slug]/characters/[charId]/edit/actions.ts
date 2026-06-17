/**
 * 角色编辑/删除 Server Actions
 * 
 * 安全校验：仅角色创建者（playerId 匹配）可以编辑或删除
 * portrait 字段通过隐藏 input 从 ImageUpload 组件传入
 */
"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * 更新角色信息
 */
export async function updateCharacter(campaignSlug: string, charId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // 权限校验：仅角色创建者可编辑
  const char = await prisma.character.findUnique({ where: { id: charId } });
  if (!char || char.playerId !== session.user.id) throw new Error("Forbidden");

  // 提取顶层字段
  const name = formData.get("name") as string;
  const bio = formData.get("bio") as string | null;
  const isPublic = formData.get("isPublic") === "true";
  const portrait = (formData.get("portrait") as string) || null;
  const qqNumber = (formData.get("qqNumber") as string)?.trim() || null;

  // 合并 sheet_ 字段到现有数据（保留未编辑的字段）
  const existingData = JSON.parse(char.sheetData || "{}");
  for (const [key, value] of formData.entries()) {
    if (!["name", "bio", "isPublic", "portrait", "qqNumber"].includes(key)) {
      existingData[key] = value;
    }
  }

  await prisma.character.update({
    where: { id: charId },
    data: {
      name,
      bio,
      isPublic,
      portrait,
      sheetData: JSON.stringify(existingData),
    },
  });

  // 处理 QQ 绑定
  if (qqNumber && /^\d{5,15}$/.test(qqNumber)) {
    // 绑定/更新：upsert BotBinding
    await prisma.botBinding.upsert({
      where: { platform_platformId: { platform: "qq", platformId: qqNumber } },
      update: { userId: session.user.id, characterId: charId },
      create: {
        platform: "qq",
        platformId: qqNumber,
        userId: session.user.id,
        characterId: charId,
      },
    });
  } else if (qqNumber === "") {
    // 清空：删除该角色的 BotBinding
    const existingBinding = await prisma.botBinding.findFirst({
      where: { characterId: charId },
    });
    if (existingBinding) {
      await prisma.botBinding.delete({ where: { id: existingBinding.id } });
    }
  }
  // qqNumber === null 表示表单中没有该字段（不应该发生，但安全处理）

  revalidatePath(`/campaigns/${campaignSlug}/characters`);
  redirect(`/campaigns/${campaignSlug}/characters/${charId}`);
}

/**
 * 删除角色
 */
export async function deleteCharacter(campaignSlug: string, charId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const char = await prisma.character.findUnique({ where: { id: charId } });
  if (!char || char.playerId !== session.user.id) throw new Error("Forbidden");

  await prisma.character.delete({ where: { id: charId } });

  revalidatePath(`/campaigns/${campaignSlug}/characters`);
  redirect(`/campaigns/${campaignSlug}/characters`);
}