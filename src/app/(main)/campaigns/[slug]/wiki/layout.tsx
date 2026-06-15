import { SubPageLayout } from "../layout";
export default async function WikiLayout({
  children, params,
}: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SubPageLayout slug={slug} page="wiki">{children}</SubPageLayout>;
}