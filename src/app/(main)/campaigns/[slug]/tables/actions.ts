/**
 * 随机表 Server Actions（创建、编辑、删除）
 * 
 * 数据格式：
 * 表单中每行为 "范围 | 结果"，如 "1 | 地精伏击"
 * 解析后存为 JSON 数组：[{ range: "1", result: "地精伏击" }, ...]
 */
"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * 解析 "范围 | 结果" 格式的文本为 JSON 数组
 */
function parseTableData(rawData: string): { range: string; result: string }[] {
  return rawData
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|");
      return { range: (parts[0] || "").trim(), result: (parts[1] || "").trim() };
    });
}

/**
 * 创建随机表
 */
export async function createRandomTable(campaignSlug: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const rawData = formData.get("tableData") as string;

  const campaign = await prisma.campaign.findUnique({
    where: { slug: campaignSlug },
    select: { id: true },
  });
  if (!campaign) throw new Error("Not found");

  const entries = parseTableData(rawData);

  await prisma.randomTable.create({
    data: {
      title,
      description,
      campaignId: campaign.id,
      authorId: session.user.id,
      tableData: JSON.stringify(entries),
    },
  });

  revalidatePath(`/campaigns/${campaignSlug}/tables`);
  redirect(`/campaigns/${campaignSlug}/tables`);
}

/**
 * 更新随机表
 */
export async function updateRandomTable(campaignSlug: string, tableId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // 权限校验：只有创建者可以编辑
  const table = await prisma.randomTable.findUnique({ where: { id: tableId } });
  if (!table || table.authorId !== session.user.id) throw new Error("Forbidden");

  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const rawData = formData.get("tableData") as string;

  const entries = parseTableData(rawData);

  await prisma.randomTable.update({
    where: { id: tableId },
    data: { title, description, tableData: JSON.stringify(entries) },
  });

  revalidatePath(`/campaigns/${campaignSlug}/tables`);
  redirect(`/campaigns/${campaignSlug}/tables`);
}

/**
 * 删除随机表
 */
export async function deleteRandomTable(campaignSlug: string, tableId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const table = await prisma.randomTable.findUnique({ where: { id: tableId } });
  if (!table || table.authorId !== session.user.id) throw new Error("Forbidden");

  await prisma.randomTable.delete({ where: { id: tableId } });

  revalidatePath(`/campaigns/${campaignSlug}/tables`);
  redirect(`/campaigns/${campaignSlug}/tables`);
}