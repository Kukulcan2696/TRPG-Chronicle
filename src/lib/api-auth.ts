/**
 * Bot API 密钥认证
 *
 * 验证 Authorization: Bearer <api_key> 请求头，
 * 通过 SHA-256 哈希与数据库中的 ApiKey 记录比对。
 */

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

export interface AuthResult {
  valid: boolean;
  keyId?: string;
  response?: NextResponse;
}

/**
 * 验证 API 请求的 Authorization header
 *
 * 用法：在 bot API 路由中调用
 *   const auth = await validateApiRequest(req);
 *   if (!auth.valid) return auth.response;
 */
export async function validateApiRequest(req: NextRequest): Promise<AuthResult> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      valid: false,
      response: NextResponse.json({ error: "缺少 API 密钥" }, { status: 401 }),
    };
  }

  const rawKey = authHeader.slice(7);
  if (!rawKey) {
    return {
      valid: false,
      response: NextResponse.json({ error: "API 密钥为空" }, { status: 401 }),
    };
  }

  const hashedKey = createHash("sha256").update(rawKey).digest("hex");

  const apiKey = await prisma.apiKey.findUnique({
    where: { key: hashedKey },
  });

  if (!apiKey) {
    return {
      valid: false,
      response: NextResponse.json({ error: "API 密钥无效" }, { status: 401 }),
    };
  }

  if (!apiKey.enabled) {
    return {
      valid: false,
      response: NextResponse.json({ error: "API 密钥已禁用" }, { status: 401 }),
    };
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return {
      valid: false,
      response: NextResponse.json({ error: "API 密钥已过期" }, { status: 401 }),
    };
  }

  // 更新最后使用时间（非阻塞）
  prisma.apiKey
    .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  return { valid: true, keyId: apiKey.id };
}

/**
 * 便捷包装：鉴权失败时返回错误响应，成功返回 null（继续处理）
 */
export async function withBotAuth(req: NextRequest): Promise<NextResponse | null> {
  const auth = await validateApiRequest(req);
  if (!auth.valid) return auth.response!;
  return null;
}
