/**
 * 随机表编辑页（弹窗模式）
 * 
 * 功能：
 * - 编辑表名、描述、表数据
 * - 预填写现有数据
 * 
 * 安全：仅创建者可编辑
 */
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateRandomTable } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PageProps { params: Promise<{ slug: string; tableId: string }> }

export default async function EditTablePage({ params }: PageProps) {
  const { slug, tableId } = await params;
  const session = await auth();

  const table = await prisma.randomTable.findUnique({ where: { id: tableId } });
  if (!table || table.authorId !== session?.user?.id) notFound();

  // 解析 JSON 为文本格式（范围 | 结果）
  let rawText = "";
  try {
    const entries: { range: string; result: string }[] = JSON.parse(table.tableData);
    rawText = entries.map((e) => `${e.range} | ${e.result}`).join("\n");
  } catch {
    rawText = table.tableData;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">编辑随机表</h1>
        <p className="text-muted-foreground">{table.title}</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {/* 
            updateRandomTable.bind(null, slug, tableId) 
            将 campaignSlug 和 tableId 预绑定为前两个参数
          */}
          <form action={updateRandomTable.bind(null, slug, tableId)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">表名</Label>
              <Input id="title" name="title" defaultValue={table.title} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Input id="description" name="description" defaultValue={table.description || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tableData">表数据</Label>
              <p className="text-xs text-muted-foreground">
                每行格式：<code className="bg-muted px-1 rounded">范围 | 结果</code>
              </p>
              <Textarea
                id="tableData"
                name="tableData"
                rows={12}
                className="font-mono text-sm"
                defaultValue={rawText}
                required
              />
            </div>

            <Button type="submit">保存修改</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}