/**
 * NextAuth.js v5 认证配置
 * 
 * NextAuth 是 Next.js 的认证库，处理用户登录、session 管理。
 * 
 * 核心概念：
 * - providers: 登录方式（GitHub、Google、邮箱密码）
 * - callbacks: 在登录流程中插入自定义逻辑（比如给 JWT 加角色字段）
 * - adapter: 数据库适配器，把用户数据存到数据库
 * - session strategy: JWT = 无状态（推荐），database = 存在数据库
 * 
 * 导出的四个函数：
 * - handlers: API 路由处理器（给 app/api/auth/[...nextauth]/route.ts 用）
 * - auth(): 在服务端获取当前登录用户
 * - signIn(): 客户端触发登录
 * - signOut(): 客户端触发登出
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // PrismaAdapter: 把 NextAuth 的用户/会话数据存到我们的 SQLite 数据库
  adapter: PrismaAdapter(prisma),

  // JWT 策略: session 信息编码在 token 里，不需要查数据库
  // 优点：快，不需要数据库维护 session 表
  session: { strategy: "jwt" },

  // 自定义登录页面路径
  pages: {
    signIn: "/login",
    error: "/login",
  },

  // ===== 登录方式 =====
  providers: [
    // GitHub OAuth 登录
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    // Google OAuth 登录
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // 邮箱+密码登录（我们自己实现校验逻辑）
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      // authorize 在用户提交登录表单时被调用
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // 从数据库查用户
        const user = await prisma.user.findUnique({
          where: { email: String(credentials.email) },
        });

        // 用户不存在或没有设置密码 → 拒绝
        if (!user || !user.password) return null;

        // bcrypt.compare: 比较明文密码和数据库中的哈希值
        const isValid = await bcrypt.compare(
          String(credentials.password),
          user.password,
        );

        if (!isValid) return null;

        // 返回的用户对象会被编码到 JWT token 中
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],

  // ===== JWT 回调: 决定哪些数据存入 token =====
  callbacks: {
    async jwt({ token, user }) {
      // user 只在首次登录时存在，后续请求只有 token
      if (user) {
        token.role = (user as any).role ?? "PLAYER";
        token.id = user.id;
      }
      return token;
    },
    // ===== Session 回调: 决定前端能读到什么 =====
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;   // 用户 ID
        (session.user as any).role = token.role; // DM 或 PLAYER
      }
      return session;
    },
  },
});