/**
 * 全局导航栏
 * 
 * 固定在页面顶部，包含：
 * - Logo + 应用名
 * - 导航链接（仪表盘、战役）
 * - 暗色模式切换
 * - 用户头像下拉菜单（个人设置、管理、退出）
 * 
 * 关键 Hooks：
 * - useSession(): 获取当前登录用户信息
 * - usePathname(): 获取当前路径，用于高亮当前导航项
 * - useRouter(): 编程式导航（用于下拉菜单点击跳转）
 */

"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";
import { Dice1, LogOut, User, Settings } from "lucide-react";

// 导航项配置：添加新页面只需在这里加一项
const navItems = [
  { href: "/dashboard", label: "仪表盘" },
  { href: "/campaigns", label: "战役" },
];

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 mr-6">
          <Dice1 className="h-5 w-5 text-primary" />
          <span className="font-bold text-lg hidden sm:inline">TRPG Chronicle</span>
        </Link>

        {/* 导航链接 - 根据当前路径高亮 */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({
                  variant: pathname?.startsWith(item.href) ? "secondary" : "ghost",
                  size: "sm",
                }),
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* 右侧：暗色切换 + 用户菜单 */}
        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />

          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger>
                {/* 用户头像 */}
                <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                  <AvatarImage src={session.user.image || ""} />
                  <AvatarFallback>
                    {session.user.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">{session.user.name}</p>
                  <p className="text-xs text-muted-foreground">{session.user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <User className="mr-2 h-4 w-4" />个人设置
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/admin")}>
                  <Settings className="mr-2 h-4 w-4" />管理
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login" className={cn(buttonVariants({ size: "sm" }))}>登录</Link>
          )}
        </div>
      </div>
    </header>
  );
}