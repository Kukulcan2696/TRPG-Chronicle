import { SubPageLayout } from "../layout";
export default async function DiceLayout({
  children, params,
}: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SubPageLayout slug={slug} page="dice">{children}</SubPageLayout>;
}