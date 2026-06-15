/**
 * 主题 Provider 封装
 * 
 * next-themes 的 ThemeProvider 负责：
 * - 在 <html> 上添加/移除 "dark" class
 * - 记住用户的主题偏好（localStorage）
 * - 防止服务端/客户端渲染不匹配（flash）
 */
"use client";
import { ThemeProvider as NextThemesProvider } from "next-themes";
export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}