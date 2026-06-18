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
  const status = (formData.get("status") as string) || char.status;
  const portrait = (formData.get("portrait") as string) || null;
  const qqNumber = (formData.get("qqNumber") as string)?.trim() || null;

  // 合并自定义字段到现有数据
  const topKeys = ["name", "bio", "isPublic", "portrait", "qqNumber", "status"];
  const existingData: Record<string, any> = JSON.parse(char.sheetData || "{}");

  // 处理现有字段更新和新增字段
  const newKeyVals: [string, string][] = []; // [key, val] pairs from new field slots

  for (const [key, value] of formData.entries()) {
    if (topKeys.includes(key)) continue;
    const strVal = value as string;

    if (key.startsWith("field_new_key_")) {
      // 新增字段的键名
      const idx = key.replace("field_new_key_", "");
      const valKey = `field_new_val_${idx}`;
      const valVal = (formData.get(valKey) as string) || "";
      if (strVal.trim()) {
        newKeyVals.push([strVal.trim(), valVal]);
      }
      continue;
    }
    if (key.startsWith("field_new_val_")) continue; // handled with key pair

    // 现有字段：去掉前缀
    const cleanKey = key.startsWith("field_") ? key.slice(6)
      : key.startsWith("sheet_") ? key.slice(6)
      : key;

    // 如果值为空字符串，删除该字段；否则更新
    if (strVal === "") {
      delete existingData[cleanKey];
    } else {
      existingData[cleanKey] = strVal;
    }
  }

  // 应用新字段
  for (const [k, v] of newKeyVals) {
    existingData[k] = v;
  }

  // 使用事务确保角色更新和 QQ 绑定操作原子性
  await prisma.$transaction(async (tx) => {
    await tx.character.update({
      where: { id: charId },
      data: {
        name,
        bio,
        isPublic,
        status,
        portrait,
        sheetData: JSON.stringify(existingData),
      },
    });

    // 处理 QQ 绑定
    if (qqNumber && /^\d{5,15}$/.test(qqNumber)) {
      const existingBinding = await tx.botBinding.findUnique({
        where: { platform_platformId: { platform: "qq", platformId: qqNumber } },
        select: { userId: true, characterId: true, character: { select: { name: true } } },
      });
      if (existingBinding) {
        if (existingBinding.userId !== session.user.id) {
          throw new Error("该 QQ 号已被其他用户绑定");
        }
        if (existingBinding.characterId && existingBinding.characterId !== charId) {
          throw new Error(
            `该 QQ 号已绑定到角色「${existingBinding.character?.name || "未知"}」，请先解绑该角色`
          );
        }
      }
      await tx.botBinding.upsert({
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
      const existingBinding = await tx.botBinding.findFirst({
        where: { characterId: charId },
      });
      if (existingBinding) {
        await tx.botBinding.update({
          where: { id: existingBinding.id },
          data: { characterId: null, campaignId: null },
        });
      }
    }
  });
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