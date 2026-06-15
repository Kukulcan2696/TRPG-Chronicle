/**
 * Prisma 客户端单例
 * 
 * Prisma 是一个 ORM（对象关系映射），让我们用 TypeScript 代码
 * 来操作数据库，而不需要写原始 SQL。
 * 
 * 例如：prisma.user.findMany() → 查询所有用户
 *       prisma.post.create({ data: {...} }) → 创建新文章
 * 
 * 这个文件确保整个应用只创建一个 PrismaClient 实例，
 * 避免在开发时热重载导致重复创建连接。
 */

import { PrismaClient } from "@prisma/client";

// globalThis 是 Node.js 的全局对象，类似浏览器里的 window
// 我们把 prisma 实例挂在 globalThis 上，保证热重载时复用
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 如果 globalThis 上已有实例就用它，否则创建新的
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// 开发环境下把实例存到 globalThis，下次热重载就不会重新创建
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;