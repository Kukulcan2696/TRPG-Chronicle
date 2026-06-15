/**
 * 主应用布局（仪表盘、战役等页面）
 * 
 * 包含全局导航栏 + 内容区
 * 注意：root layout 包裹 auth layout 和 main layout
 *       main layout 再包裹仪表盘和战役页面
 *       auth layout 再包裹登录和注册页面
 * 
 * Next.js 嵌套布局示意：
 * RootLayout
 *   ├── AuthLayout → /login, /register
 *   └── MainLayout → /dashboard, /campaigns/...
 */
import { Navbar } from "@/components/layout/navbar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </>
  );
}