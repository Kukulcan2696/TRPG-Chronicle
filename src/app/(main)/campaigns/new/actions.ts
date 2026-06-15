/**
 * 创建战役 Server Action
 * 
 * "use server" 指令告诉 Next.js 这个函数只在服务端执行。
 * 客户端通过 form action 属性直接调用，不需要手写 fetch。
 * 
 * 流程：
 * 1. 获取当前用户
 * 2. 校验 slug 格式（不能包含 / 等非法字符）
 * 3. 写入数据库（同时把自己加为 DM 成员）
 * 4. revalidatePath 清除缓存 → redirect 跳转
 */

"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createCampaign(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string | null;

  // ===== 校验 slug 格式 =====
  // slug 作为 URL 路径的一部分，只能包含字母、数字、连字符和下划线
  if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
    throw new Error("URL 标识只能包含英文字母、数字、连字符(-)和下划线(_)，不能包含斜杠、空格和中文");
  }

  // 检查 slug 是否已被占用
  const existing = await prisma.campaign.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (existing) {
    throw new Error("该 URL 标识已被占用，请换一个");
  }

  await prisma.campaign.create({
    data: {
      title,
      slug,
      description,
      dmId: session.user.id,
      // 同时创建 CampaignMember 关系（DM 自己作为第一个成员）
      members: { create: { userId: session.user.id, role: "DM" } },
    },
  });

  revalidatePath("/campaigns");
  redirect(`/campaigns/${slug}`);
}