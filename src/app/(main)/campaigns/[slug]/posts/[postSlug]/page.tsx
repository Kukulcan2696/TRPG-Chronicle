import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { MarkdownRenderer } from "@/lib/markdown";
import { DeletePostButton } from "@/components/post/delete-button";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ArrowLeft, Clock, Pencil } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string; postSlug: string }>;
}

export default async function PostPage({ params }: PageProps) {
  const { slug, postSlug } = await params;
  const session = await auth();

  const post = await prisma.post.findFirst({
    where: { slug: postSlug, campaign: { slug } },
    include: {
      author: { select: { id: true, name: true, image: true } },
      campaign: { select: { title: true, slug: true } },
    },
  });

  if (!post) notFound();

  const isAuthor = session?.user?.id && post.author && session.user.id === post.author.id;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/campaigns/${slug}/posts`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回战报列表
        </Link>
        {isAuthor && (
          <div className="flex gap-2">
            <Link
              href={`/campaigns/${slug}/posts/${post.slug}/edit`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Pencil className="mr-1 h-4 w-4" />
              编辑
            </Link>
            <DeletePostButton campaignSlug={slug} postId={post.id} />
          </div>
        )}
      </div>

      <article>
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {post.sessionNumber && (
              <Badge variant="secondary">第 {post.sessionNumber} 次</Badge>
            )}
            <Link href={`/campaigns/${slug}`}>
              <Badge variant="outline" className="hover:bg-muted">
                {post.campaign.title}
              </Badge>
            </Link>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={post.author?.image || ""} />
                <AvatarFallback>
                  {post.author?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <span>{post.author?.name ?? "未知用户"}</span>
            </div>
            {post.gameDate && (
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {format(new Date(post.gameDate), "yyyy年M月d日", {
                  locale: zhCN,
                })}
              </div>
            )}
          </div>
        </header>

        <Separator className="my-8" />

        <MarkdownRenderer content={post.content} />
      </article>
    </div>
  );
}