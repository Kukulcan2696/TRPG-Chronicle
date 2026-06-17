/**
 * CLI 脚本：生成 Bot API 密钥
 *
 * 用法：
 *   npx tsx scripts/generate-api-key.ts [名称]
 *
 * 示例：
 *   npx tsx scripts/generate-api-key.ts astrbot-prod
 */

import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "crypto";
import dotenv from "dotenv";
import path from "path";

// 加载 .env
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const prisma = new PrismaClient();

async function main() {
  const name = process.argv[2] || "default";

  const rawKey = randomBytes(32).toString("hex");
  const prefix = rawKey.slice(0, 8);
  const hashedKey = createHash("sha256").update(rawKey).digest("hex");

  await prisma.apiKey.create({
    data: { name, key: hashedKey, prefix },
  });

  console.log("\n✅ API Key 生成成功！\n");
  console.log("  名称:  ", name);
  console.log("  前缀:  ", prefix);
  console.log("  密钥:  ", rawKey);
  console.log("\n  ⚠ 请立即保存密钥，生成后无法再次查看！\n");
  console.log(
    '  在 AstrBot 插件配置中设置:  api_key: "' + rawKey + '"\n'
  );
}

main()
  .catch((e) => {
    console.error("❌ 生成失败:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
