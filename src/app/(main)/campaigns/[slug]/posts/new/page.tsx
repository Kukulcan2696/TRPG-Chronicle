import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createPost } from "./actions";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const TRPG_SYNTAX_HELP = [
  { syntax: "::dice[2d6+3]", desc: "骰子徽章" },
  { syntax: "::char[角色名]", desc: "角色链接" },
  { syntax: "::wiki[类型:条目]", desc: "百科链接" },
  { syntax: "::handout[描述](图片URL)", desc: "手札/图片嵌入" },
  { syntax: "::secret 内容", desc: "主持人专属段落" },
];

export default async function NewPostPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth();

  const campaign = await prisma.campaign.findUnique({
    where: { slug },
    select: { id: true, title: true },
  });
  if (!campaign) notFound();

  const postCount = await prisma.post.count({
    where: { campaignId: campaign.id },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">写战报</h1>
        <p className="text-muted-foreground">
          为「{campaign.title}」撰写新战报
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>战报内容</CardTitle>
              <CardDescription>使用 Markdown 撰写，支持自定义跑团语法</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                action={createPost.bind(null, slug)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="title">标题</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="例：第一章：踏入冰风谷"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL 标识</Label>
                  <Input
                    id="slug"
                    name="slug"
                    placeholder="chapter-1-icewind"
                    required
                    pattern="[a-z0-9-]+"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionNumber">场次编号</Label>
                    <Input
                      id="sessionNumber"
                      name="sessionNumber"
                      type="number"
                      placeholder={String(postCount + 1)}
                      min={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gameDate">游戏日期</Label>
                    <Input id="gameDate" name="gameDate" type="date" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">正文 (Markdown)</Label>
                  <Textarea
                    id="content"
                    name="content"
                    rows={20}
                    className="font-mono text-sm"
                    placeholder={`# 第一章：冒险开始

## 前情提要

上一回说到...

## 本回剧情

::dice[2d6+3] 检定成功！

::char[甘道夫] 使用火焰箭攻击了兽人。

## 战利品

- 金币 × 50
- 魔法长剑

::secret 兽人背后其实是... 留着下回揭晓
`}
                    required
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch id="published" name="published" value="true" />
                    <Label htmlFor="published">立即发布</Label>
                  </div>
                  <Button type="submit">保存战报</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">跑团自定义语法</p>
              <ul className="space-y-1.5 text-sm">
                {TRPG_SYNTAX_HELP.map((item) => (
                  <li key={item.syntax}>
                    <code className="bg-muted px-1 py-0.5 rounded text-xs">
                      {item.syntax}
                    </code>
                    <span className="ml-2 text-muted-foreground">
                      {item.desc}
                    </span>
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Markdown 基础</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <p><code className="bg-muted px-1 rounded"># 标题</code> 一级标题</p>
              <p><code className="bg-muted px-1 rounded">## 标题</code> 二级标题</p>
              <p><code className="bg-muted px-1 rounded">**加粗**</code> 粗体文字</p>
              <p><code className="bg-muted px-1 rounded">*斜体*</code> 斜体文字</p>
              <p><code className="bg-muted px-1 rounded">- 项目</code> 无序列表</p>
              <p><code className="bg-muted px-1 rounded">1. 项目</code> 有序列表</p>
              <p><code className="bg-muted px-1 rounded">{">"} 引用</code> 块引用</p>
              <p><code className="bg-muted px-1 rounded">---</code> 分割线</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}