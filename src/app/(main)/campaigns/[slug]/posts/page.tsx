/**
 * 战报列表页（弹窗模式）
 * 
 * 显示某个战役下所有已发布的战报。
 * 由于 posts/layout.tsx 包裹了 SubPageLayout，
 * 这个页面会自动以弹窗+面包屑的形式展示。
 */

import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ScrollText, Plus } from "lucide-react";

interface PageProps { params: Promise<{ slug: string }> }

export default async function PostsPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth();

  // 先查战役是否存在
  const campaign = await prisma.campaign.findUnique({
    where: { slug },
    select: { id: true, title: true, dmId: true },
  });
  if (!campaign) notFound();

  // 查战役下所有已发布的战报
  const posts = await prisma.post.findMany({
    where: { campaignId: campaign.id, published: true },
    orderBy: [{ sessionNumber: "desc" }, { createdAt: "desc" }],
    include: { author: { select: { name: true, image: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">战报</h1>
          <p className="text-muted-foreground">
            <Link href={`/campaigns/${slug}`} className="hover:text-primary transition-colors">
              {campaign.title}
            </Link>
            {" "}· 共 {posts.length} 篇
          </p>
        </div>
        <Link href={`/campaigns/${slug}/posts/new`} className={buttonVariants()}>
          <Plus className="mr-2 h-4 w-4" />写战报
        </Link>
      </div>

      {posts.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <ScrollText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">还没有战报</h3>
            <p className="text-muted-foreground mb-4">写下第一篇跑团战报，开始记录冒险</p>
            <Link href={`/campaigns/${slug}/posts/new`} className={buttonVariants()}>写战报</Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Link key={post.id} href={`/campaigns/${slug}/posts/${post.slug}`}>
              <Card className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {post.sessionNumber && (
                          <Badge variant="outline" className="mr-2 text-xs">#{post.sessionNumber}</Badge>
                        )}
                        {post.title}
                      </CardTitle>
                      <CardDescription>
                        by {post.author?.name ?? "未知用户"}
                        {post.gameDate && ` · ${format(new Date(post.gameDate), "yyyy年M月d日", { locale: zhCN })}`}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                {post.excerpt && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}