/**
 * 角色编辑页（弹窗模式）
 *
 * 功能：
 * - 编辑角色名、背景、公开/隐藏、状态、QQ绑定
 * - 更换头像
 * - 灵活字段系统：增删改角色卡自定义字段
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
import { Badge } from "@/components/ui/badge";
import { PortraitUpload } from "@/components/media/portrait-upload";

interface PageProps { params: Promise<{ slug: string; charId: string }> }

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "草稿",
  COMPLETE: "完成",
  APPROVED: "已批准",
};

export default async function EditCharacterPage({ params }: PageProps) {
  const { slug, charId } = await params;
  const session = await auth();

  const character = await prisma.character.findUnique({
    where: { id: charId },
    include: { campaign: { select: { title: true } } },
  });
  if (!character || character.playerId !== session?.user?.id) notFound();

  const sheetData: Record<string, any> = JSON.parse(character.sheetData || "{}");

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

            {/* 状态选择 */}
            <div className="space-y-2">
              <Label htmlFor="status">角色卡状态</Label>
              <select id="status" name="status" className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm" defaultValue={character.status}>
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
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
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">角色数据</h3>
                <span className="text-xs text-muted-foreground">
                  删除字段：留空即可（或点击 ✕）
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(sheetData).map(([key, value]) => (
                  <div key={key} className="space-y-1.5">
                    <Label htmlFor={`field_${key}`} className="text-xs truncate block">
                      {key}
                    </Label>
                    <Input
                      id={`field_${key}`}
                      name={`field_${key}`}
                      defaultValue={String(value)}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
                {/* 新增字段插槽 */}
                {[0, 1, 2].map((i) => (
                  <div key={`new_${i}`} className="space-y-1.5">
                    <Input
                      name={`field_new_key_${i}`}
                      placeholder="字段名"
                      className="h-7 text-xs"
                    />
                    <Input
                      name={`field_new_val_${i}`}
                      placeholder="值"
                      className="h-8 text-sm"
                    />
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
