/**
 * 个人设置 Server Actions
 * 
 * 功能：
 * - updateProfile: 更新用户名、头像
 * - 如果提供了 newPassword，则同时修改密码（需验证 currentPassword）
 */

"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("未登录");

  const name = formData.get("name") as string;
  const image = formData.get("image") as string;
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;

  // 基础更新数据
  const updateData: Record<string, any> = {
    name: name || null,
    image: image || null,
  };

  // 如果填写了新密码，需要验证当前密码
  if (newPassword) {
    if (!currentPassword) {
      throw new Error("请输入当前密码");
    }

    // 获取用户当前密码哈希
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user?.password) {
      throw new Error("当前账号没有设置密码（可能通过第三方登录）");
    }

    // 验证当前密码是否正确
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new Error("当前密码不正确");
    }

    // 加密新密码并更新
    updateData.password = await bcrypt.hash(newPassword, 10);
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
  });

  revalidatePath("/profile");
}