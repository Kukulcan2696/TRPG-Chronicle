import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createRandomTable } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PageProps { params: Promise<{ slug: string }> }

export default async function NewTablePage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth();
  const campaign = await prisma.campaign.findUnique({ where: { slug }, select: { id: true, title: true } });
  if (!campaign) notFound();

  return (<div className="max-w-2xl mx-auto space-y-6">
    <div><h1 className="text-2xl font-bold">新建随机表</h1><p className="text-muted-foreground">为「{campaign.title}」创建掷表</p></div>
    <Card><CardContent className="pt-6">
      <form action={createRandomTable.bind(null, slug)} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="title">表名</Label><Input id="title" name="title" placeholder="例：随机遭遇表" required /></div>
        <div className="space-y-2"><Label htmlFor="description">描述</Label><Input id="description" name="description" placeholder="d6 遭遇表" /></div>
        <div className="space-y-2">
          <Label htmlFor="tableData">表数据</Label>
          <p className="text-xs text-muted-foreground">每行格式：<code className="bg-muted px-1 rounded">范围 | 结果</code></p>
          <Textarea id="tableData" name="tableData" rows={12} className="font-mono text-sm" placeholder={"1 | 地精伏击\\n2 | 商队路过\\n3 | 废弃营地\\n4 | 狼群\\n5 | 旅人求助\\n6 | 宝藏线索"} required />
        </div>
        <Button type="submit">创建随机表</Button>
      </form>
    </CardContent></Card>
  </div>);
}