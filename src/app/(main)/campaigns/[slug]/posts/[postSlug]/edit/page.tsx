import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updatePost } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PageProps {
  params: Promise<{ slug: string; postSlug: string }>;
}

export default async function EditPostPage({ params }: PageProps) {
  const { slug, postSlug } = await params;
  const session = await auth();

  const post = await prisma.post.findFirst({
    where: { slug: postSlug, campaign: { slug } },
    include: { campaign: { select: { id: true, title: true } } },
  });

  if (!post) notFound();
  if (post.authorId !== session?.user?.id) notFound();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">编辑战报</h1>
        <p className="text-muted-foreground">编辑「{post.campaign.title}」的战报</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form
            action={updatePost.bind(null, slug, post.id)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="title">标题</Label>
              <Input id="title" name="title" defaultValue={post.title} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL 标识</Label>
              <Input id="slug" name="slug" defaultValue={post.slug} required pattern="[a-z0-9-]+" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sessionNumber">场次编号</Label>
                <Input id="sessionNumber" name="sessionNumber" type="number" defaultValue={post.sessionNumber ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gameDate">游戏日期</Label>
                <Input id="gameDate" name="gameDate" type="date" defaultValue={post.gameDate?.toISOString().split("T")[0] ?? ""} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">正文 (Markdown)</Label>
              <Textarea id="content" name="content" rows={20} className="font-mono text-sm" defaultValue={post.content} required />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch id="published" name="published" value="true" defaultChecked={post.published} />
                <Label htmlFor="published">已发布</Label>
              </div>
              <Button type="submit">保存修改</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}