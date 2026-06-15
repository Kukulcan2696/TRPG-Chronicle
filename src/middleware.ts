/**
 * 路由守卫中间件
 * 
 * Next.js 中间件在所有页面请求前执行，用于：
 * 1. 未登录用户 → 重定向到 /login（首页、加入页除外）
 * 2. 已登录用户访问登录页 → 重定向到 /dashboard
 * 
 * auth() 是 NextAuth 的中间件辅助函数，
 * req.auth 可以获取当前用户的 session。
 */

import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register");
  const isPublicPage =
    req.nextUrl.pathname === "/" ||
    req.nextUrl.pathname.startsWith("/join");

  // 未登录 + 不是公开页 + 不是认证页 → 跳到登录
  if (!isLoggedIn && !isAuthPage && !isPublicPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 已登录 + 访问认证页 → 跳到仪表盘（已经登了，不需要再登）
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next(); // 放行
});

// matcher: 哪些路径需要经过中间件
// 排除 API 路由、静态文件、图标、上传文件
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|uploads|favicon.ico).*)"],
};