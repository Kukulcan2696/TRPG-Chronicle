/**
 * 创建战役 Server Action
 * 
 * "use server" 指令告诉 Next.js 这个函数只在服务端执行。
 * 客户端通过 form action 属性直接调用，不需要手写 fetch。
 * 
 * 流程：
 * 1. 获取当前用户（auth）
 * 2. 从 FormData 读取表单字段
 * 3. prisma.campaign.create 写入数据库（同时把自己加为 DM 成员）
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

  // revalidatePath: 告诉 Next.js 这个路径的缓存已过期，下次访问重新渲染
  revalidatePath("/campaigns");
  redirect(`/campaigns/${slug}`);
}