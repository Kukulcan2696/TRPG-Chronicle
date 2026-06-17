/**
 * 角色编辑页（弹窗模式）
 * 
 * 功能：
 * - 编辑角色名、背景、公开/隐藏状态
 * - 更换头像（ImageUpload 组件）
 * - 编辑角色卡的自定义字段（sheetData）
 */
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateCharacter } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { PortraitUpload } from "@/components/media/portrait-upload";

interface PageProps { params: Promise<{ slug: string; charId: string }> }

export default async function EditCharacterPage({ params }: PageProps) {
  const { slug, charId } = await params;
  const session = await auth();

  // 获取角色信息，仅角色创建者可编辑
  const character = await prisma.character.findUnique({
    where: { id: charId },
    include: { campaign: { select: { title: true } } },
  });
  if (!character || character.playerId !== session?.user?.id) notFound();

  // 解析角色卡 JSON 数据
  const sheetData = JSON.parse(character.sheetData || "{}");

  // 查询角色绑定的 QQ
  const charBinding = await prisma.botBinding.findFirst({
    where: { characterId: charId },
    select: { platformId: true },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">编辑角色</h1>
        <p className="text-muted-foreground">{character.name} · {character.campaign.title}</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action={updateCharacter.bind(null, slug, charId)} className="space-y-4">
            {/* ===== 头像上传 ===== */}
            <div className="space-y-2">
              <Label>角色头像</Label>
              <PortraitUpload name="portrait" currentUrl={character.portrait} width={200} height={200} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">角色名</Label>
              <Input id="name" name="name" defaultValue={character.name} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">背景简介</Label>
              <Textarea id="bio" name="bio" defaultValue={character.bio || ""} rows={4} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qqNumber">绑定 QQ</Label>
              <Input
                id="qqNumber"
                name="qqNumber"
                defaultValue={charBinding?.platformId || ""}
                placeholder="输入 QQ 号（可选）"
                pattern="\d{5,15}"
              />
              <p className="text-xs text-muted-foreground">
                绑定后，该 QQ 号在群内掷骰和查角色时将关联到此角色
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Switch id="isPublic" name="isPublic" value="true" defaultChecked={character.isPublic} />
              <Label htmlFor="isPublic">公开角色卡</Label>
            </div>

            {/* ===== 角色卡自定义字段 ===== */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-sm mb-3">角色数据</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(sheetData).map(([key, value]) => (
                  <div key={key} className="space-y-1.5">
                    <Label htmlFor={`sheet_${key}`} className="text-xs">{key}</Label>
                    <Input id={`sheet_${key}`} name={`sheet_${key}`} defaultValue={String(value)} className="h-8 text-sm" />
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit">保存修改</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}