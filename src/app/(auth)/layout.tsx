/**
 * 认证页面布局
 * 
 * 登录和注册页面共享的布局：居中显示，渐变背景
 * Next.js 的 layout.tsx 会包裹同目录和子目录下的所有 page.tsx
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      {children}
    </div>
  );
}