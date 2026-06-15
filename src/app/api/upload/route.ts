/**
 * ͼƬ�ϴ� API
 * 
 * ���ܣ�����ǰ���ϴ���ͼƬ�ļ������浽 public/uploads/ Ŀ¼��
 * ���ؿɷ��ʵ� URL ·����
 * 
 * ��ȫ��ʩ��
 * - ֻ����ͼƬ���ͣ�JPEG��PNG��GIF��WebP��
 * - �����ļ���СΪ 5MB
 * - ʹ�� UUID �������ļ�����ֹ�ļ�����ͻ��·������
 * 
 * ʹ�÷�ʽ��
 *   POST /api/upload
 *   Content-Type: multipart/form-data
 *   Body: file (ͼƬ�ļ�)
 *   ��Ӧ: { url: "/uploads/uuid-filename.png" }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { randomUUID } from "crypto";
import { writeFile } from "fs/promises";
import { join } from "path";

// �����ͼƬ MIME ����
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

// ����ļ���С��5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * POST /api/upload
 * ����ͼƬ�ϴ�����
 */
export async function POST(request: NextRequest) {
  // ===== 1. ��֤��� =====
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "���ȵ�¼" }, { status: 401 });
  }

  try {
    // ===== 2. ���� multipart/form-data =====
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    // ����Ƿ����ļ�
    if (!file || file.size === 0) {
      return NextResponse.json({ error: "û��ѡ���ļ�" }, { status: 400 });
    }

    // ===== 3. ����У�� =====
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "ֻ֧�� JPEG��PNG��GIF��WebP ��ʽ" },
        { status: 400 }
      );
    }

    // ===== 4. ��СУ�� =====
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "�ļ���С���ܳ��� 5MB" },
        { status: 400 }
      );
    }

    // ===== 5. ����Ψһ�ļ��� =====
    // ��ȡԭʼ�ļ���չ��
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    // �� UUID ��ֹ�ļ�����ͻ��·����������
    const filename = `${randomUUID()}.${ext}`;

    // ===== 6. д����� =====
    // public/uploads/ Ŀ¼�µ��ļ�����ֱ��ͨ�� /uploads/xxx ����
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadDir = join(process.cwd(), "public", "uploads");
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // ===== 7. ���ط��� URL =====
    const url = `/uploads/${filename}`;
    return NextResponse.json({ url });
  } catch (error) {
    // ��������δԤ�ڵĴ���
    console.error("�ϴ�ʧ��:", error);
    return NextResponse.json({ error: "�ϴ�ʧ�ܣ����Ժ�����" }, { status: 500 });
  }
}
