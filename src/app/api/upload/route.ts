/**
 * 图片上传 API
 * 
 * 功能：接收前端上传的图片文件，保存到 public/uploads/ 目录，
 * 返回可访问的 URL 路径。
 * 
 * 安全措施：
 * - 只允许图片类型（JPEG、PNG、GIF、WebP）
 * - 限制文件大小为 5MB
 * - 使用 UUID 重命名文件，防止文件名冲突和路径遍历
 * 
 * 使用方式：
 *   POST /api/upload
 *   Content-Type: multipart/form-data
 *   Body: file (图片文件)
 *   响应: { url: "/uploads/uuid-filename.png" }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { randomUUID } from "crypto";
import { writeFile } from "fs/promises";
import { join } from "path";

// 允许的图片 MIME 类型
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

// 最大文件大小：5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * POST /api/upload
 * 处理图片上传请求
 */
export async function POST(request: NextRequest) {
  // ===== 1. 认证检查 =====
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    // ===== 2. 解析 multipart/form-data =====
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "没有选择文件" }, { status: 400 });
    }

    // ===== 3. 类型校验 =====
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "只支持 JPEG、PNG、GIF、WebP 格式" },
        { status: 400 }
      );
    }

    // ===== 4. 大小校验 =====
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "文件大小不能超过 5MB" },
        { status: 400 }
      );
    }

    // ===== 5. 生成唯一文件名 =====
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const filename = `${randomUUID()}.${ext}`;

    // ===== 6. 写入磁盘 =====
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadDir = join(process.cwd(), "public", "uploads");
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // ===== 7. 返回访问 URL =====
    const url = `/uploads/${filename}`;
    return NextResponse.json({ url });
  } catch (error) {
    console.error("上传失败:", error);
    return NextResponse.json({ error: "上传失败，请稍后重试" }, { status: 500 });
  }
}