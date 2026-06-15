/**
 * 战报子页面弹窗布局
 * 所有 /campaigns/[slug]/posts/... 页面都会用弹窗显示
 */
import { SubPageLayout } from "../layout";
export default async function PostsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <SubPageLayout slug={slug} page="posts">{children}</SubPageLayout>;
}