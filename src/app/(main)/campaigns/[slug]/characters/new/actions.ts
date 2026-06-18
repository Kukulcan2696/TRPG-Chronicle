/**
 * 创建角色 Server Action — 支持四种模式
 *
 * 模式（通过 _mode 字段区分）：
 * - template: 从模板创建（默认）
 * - blank: 空白创建
 * - copy: 复制已有角色
 * - import: JSON 导入
 */
"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createCharacter(campaignSlug: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const mode = (formData.get("_mode") as string) || "template";

  // 校验战役存在
  const campaign = await prisma.campaign.findUnique({
    where: { slug: campaignSlug },
    select: { id: true },
  });
  if (!campaign) throw new Error("战役不存在");

  let name: string;
  let system: string;
  let bio: string | null;
  let sheetData: Record<string, any> = {};

  // ===== 空白模式 =====
  if (mode === "blank") {
    name = (formData.get("name") as string)?.trim();
    system = (formData.get("system_blank") as string) || "CUSTOM";
    bio = (formData.get("bio") as string) || null;
    sheetData = {};
  }
  // ===== 复制模式 =====
  else if (mode === "copy") {
    name = (formData.get("name") as string)?.trim();
    const copySourceId = (formData.get("copySource") as string);
    bio = (formData.get("bio") as string) || null;

    if (!copySourceId) throw new Error("请选择要复制的角色");

    const source = await prisma.character.findUnique({
      where: { id: copySourceId },
      select: { name: true, system: true, sheetData: true, bio: true },
    });
    if (!source || source.name !== name) {
      // source.name 是原角色名，name 是用户输入的名字（可能已修改）
    }
    system = source?.system || "CUSTOM";
    try {
      sheetData = JSON.parse(source?.sheetData || "{}");
    } catch {
      sheetData = {};
    }
    // 如果用户没填名字，用原角色名 + 副本
    if (!name) name = `${source?.name || "未命名"} 副本`;
    if (!bio) bio = source?.bio || null;
  }
  // ===== JSON 导入模式 =====
  else if (mode === "import") {
    name = (formData.get("name") as string)?.trim();
    system = (formData.get("import_system") as string) || "CUSTOM";
    bio = (formData.get("bio") as string) || null;
    const importJson = (formData.get("importJson") as string)?.trim();
    if (importJson) {
      try {
        sheetData = JSON.parse(importJson);
        if (typeof sheetData !== "object" || Array.isArray(sheetData)) {
          throw new Error("JSON 必须是对象格式");
        }
      } catch (e: any) {
        throw new Error(`JSON 解析失败: ${e.message}`);
      }
    }
  }
  // ===== 模板模式（默认） =====
  else {
    name = (formData.get("name") as string)?.trim();
    system = (formData.get("system") as string) || "CUSTOM";
    bio = (formData.get("bio") as string) || null;

    // 收集模板字段
    const topKeys = ["name", "system", "bio", "isPublic", "portrait", "_mode",
      "system_blank", "copySource", "import_system", "importJson", "systemBlank"];
    for (const [key, value] of formData.entries()) {
      if (!topKeys.includes(key)) {
        const cleanKey = key.startsWith("field_") ? key.slice(6)
          : key.startsWith("sheet_") ? key.slice(6)
          : key;
        sheetData[cleanKey] = value;
      }
    }
  }

  if (!name) throw new Error("角色名不能为空");

  const isPublic = formData.get("isPublic") === "true";
  const portrait = (formData.get("portrait") as string) || null;

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

  revalidatePath(`/campaigns/${campaignSlug}/characters`);
  redirect(`/campaigns/${campaignSlug}/characters/${character.id}`);
}
