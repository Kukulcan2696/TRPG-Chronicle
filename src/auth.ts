/**
 * NextAuth.js v5 认证配置
 * 
 * 核心概念：
 * - providers: 登录方式（邮箱密码 / GitHub / Google）
 * - callbacks: 登录流程中注入自定义逻辑
 * - adapter: 数据库适配器
 * - session strategy: JWT = 无状态
 * 
 * 生产环境必需的环境变量：
 *   AUTH_SECRET="随机密钥"
 *   AUTH_URL="https://你的域名"
 *   AUTH_TRUST_HOST="true"    ← 反代部署时必须
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// OAuth provider 仅在配置了对应环境变量时才启用
const providers: any[] = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "邮箱", type: "email" },
      password: { label: "密码", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      const user = await prisma.user.findUnique({
        where: { email: String(credentials.email) },
      });

      if (!user || !user.password) return null;

      const isValid = await bcrypt.compare(
        String(credentials.password),
        user.password,
      );

      if (!isValid) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
      };
    },
  }),
];

// GitHub OAuth（仅当环境变量存在时启用）
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  );
}

// Google OAuth（仅当环境变量存在时启用）
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  // ===== 生产环境关键配置 =====
  // 信任反向代理传递的 Host / X-Forwarded-Proto 头
  // 不设置会导致重定向循环（ERR_TOO_MANY_REDIRECTS）
  trustHost: true,

  providers,

  // ===== JWT 回调 =====
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role ?? "USER";
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
});