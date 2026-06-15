/**
 * 战役子页面布局
 * 
 * 概览页 (/campaigns/[slug])：直接全宽显示内容
 * 子页面 (/campaigns/[slug]/posts 等)：弹窗模式 + 面包屑
 * 
 * 通过判断路径深度来决定是否使用弹窗。
 * 如果路径段数 > 2（即 /campaigns/some-slug/xxx），则弹窗。
 */

import { ModalWrapper } from "@/components/layout/modal-wrapper";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

// 子页面的中文名称映射
const PAGE_LABELS: Record<string, string> = {
  posts: "战报",
  characters: "角色",
  wiki: "百科",
  timeline: "时间线",
  dice: "骰子",
  schedule: "排期",
  tables: "随机表",
};

export default async function CampaignLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  // 获取战役信息用于面包屑
  const campaign = await prisma.campaign.findUnique({
    where: { slug },
    select: { title: true },
  });
  if (!campaign) notFound();

  // 用 React 内部的 segment 来判断是否为子页面比较复杂，
  // 这里用一个简洁方案：用 headers 获取当前路径
  // 但实际上在 server component 中无法直接获取路径。
  // 
  // 替代方案：子页面自己决定是否用弹窗。
  // 这里先提供基础布局，子页面如果需要弹窗可以自己包裹 ModalWrapper。
  
  return <>{children}</>;
}

/**
 * 子页面弹窗布局（导出给子页面的 layout 使用）
 * 使用方式：在子页面的 layout.tsx 中调用
 *   import { SubPageLayout } from "../layout";
 *   export default function Layout({ children }) {
 *     return <SubPageLayout slug={slug} page="posts">{children}</SubPageLayout>;
 *   }
 */
export function SubPageLayout({
  slug,
  page,
  children,
}: {
  slug: string;
  page: string;
  children: React.ReactNode;
}) {
  return (
    <ModalWrapper campaignSlug={slug}>
      <Breadcrumb
        items={[
          { label: "概览", href: `/campaigns/${slug}` },
          { label: PAGE_LABELS[page] || page },
        ]}
      />
      {children}
    </ModalWrapper>
  );
}