/**
 * 角色编辑页 — 模板感知渲染
 *
 * 根据角色 system 匹配模板，按 section 分组显示字段，
 * 使用中文标签和正确的输入类型。
 */
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateCharacter } from "./actions";
import { CHARACTER_TEMPLATES, type SheetField } from "@/lib/character-templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { PortraitUpload } from "@/components/media/portrait-upload";

interface PageProps { params: Promise<{ slug: string; charId: string }> }

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "草稿", COMPLETE: "完成", APPROVED: "已批准",
};

/** 渲染单个模板字段（非 section 类型） */
function RenderTemplateField({
  field,
  sheetData,
  prefix,
}: {
  field: SheetField;
  sheetData: Record<string, any>;
  prefix: string;
}) {
  const key = field.key;
  const rawVal = sheetData[key] ?? sheetData[`sheet_${key}`] ?? field.defaultValue ?? "";

  if (field.type === "textarea") {
    return (
      <div className="col-span-full space-y-1.5">
        <Label htmlFor={`${prefix}${key}`} className="text-xs">{field.label}</Label>
        <Textarea id={`${prefix}${key}`} name={`${prefix}${key}`} defaultValue={String(rawVal)}
          placeholder={field.placeholder} rows={3} className="text-sm" />
      </div>
    );
  }
  if (field.type === "select") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}${key}`} className="text-xs">{field.label}</Label>
        <select id={`${prefix}${key}`} name={`${prefix}${key}`}
          defaultValue={String(rawVal)}
          className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    );
  }
  if (field.type === "number") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}${key}`} className="text-xs">{field.label}</Label>
        <Input id={`${prefix}${key}`} name={`${prefix}${key}`} type="number"
          defaultValue={String(rawVal)} placeholder={field.placeholder} className="h-8 text-sm" />
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`${prefix}${key}`} className="text-xs">{field.label}</Label>
      <Input id={`${prefix}${key}`} name={`${prefix}${key}`} type="text"
        defaultValue={String(rawVal)} placeholder={field.placeholder} className="h-8 text-sm" />
    </div>
  );
}

/** 获取模板中所有定义的 key（用于区分自定义字段） */
function getAllTemplateKeys(template: typeof CHARACTER_TEMPLATES[number]): Set<string> {
  const keys = new Set<string>();
  for (const field of template.fields) {
    if (field.type === "section" && field.fields) {
      for (const f of field.fields) keys.add(f.key);
    } else {
      keys.add(field.key);
    }
  }
  return keys;
}

export default async function EditCharacterPage({ params }: PageProps) {
  const { slug, charId } = await params;
  const session = await auth();

  const character = await prisma.character.findUnique({
    where: { id: charId },
    include: { campaign: { select: { title: true } } },
  });
  if (!character || character.playerId !== session?.user?.id) notFound();

  // 安全解析 sheetData
  let sheetData: Record<string, any> = {};
  try {
    sheetData = JSON.parse(character.sheetData || "{}");
  } catch { /* 解析失败回退为空对象 */ }

  const charBinding = await prisma.botBinding.findFirst({
    where: { characterId: charId },
    select: { platformId: true },
  });

  // 查找模板
  const template = CHARACTER_TEMPLATES.find((t) => t.id === character.system);
  const templateKeys = template ? getAllTemplateKeys(template) : new Set<string>();

  // 自定义字段（不在模板中的 key）
  const customKeys = Object.keys(sheetData).filter(
    (k) => !templateKeys.has(k) && !templateKeys.has(`sheet_${k}`) && k !== "sheet_"
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">编辑角色</h1>
        <p className="text-muted-foreground">{character.name} · {character.campaign.title}</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action={updateCharacter.bind(null, slug, charId)} className="space-y-4">
            {/* 头像 */}
            <div className="space-y-2">
              <Label>角色头像</Label>
              <PortraitUpload name="portrait" currentUrl={character.portrait} width={200} height={200} />
            </div>

            {/* 基本信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">角色名</Label>
                <Input id="name" name="name" defaultValue={character.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">状态</Label>
                <select id="status" name="status"
                  className="flex h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  defaultValue={character.status}>
                  {Object.entries(STATUS_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">背景简介</Label>
              <Textarea id="bio" name="bio" defaultValue={character.bio || ""} rows={4} />
            </div>

            {/* QQ 绑定 */}
            <div className="space-y-2">
              <Label htmlFor="qqNumber">绑定 QQ</Label>
              <Input id="qqNumber" name="qqNumber"
                defaultValue={charBinding?.platformId || ""}
                placeholder="输入 QQ 号（可选）" pattern="\d{5,15}" />
              <p className="text-xs text-muted-foreground">
                绑定后，该 QQ 号在群内掷骰和查角色时将关联到此角色
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Switch id="isPublic" name="isPublic" value="true" defaultChecked={character.isPublic} />
              <Label htmlFor="isPublic">公开角色卡</Label>
            </div>

            {/* ===== 模板字段 ===== */}
            {template ? (
              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold text-sm">{template.name} 属性</h3>
                {template.fields.map((field) => {
                  if (field.type === "section" && field.fields) {
                    return (
                      <div key={field.key} className="space-y-3">
                        <h4 className="text-sm font-medium border-b pb-1">{field.label}</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {field.fields.map((f) => (
                            <RenderTemplateField key={f.key} field={f} sheetData={sheetData} prefix="field_" />
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <RenderTemplateField key={field.key} field={field} sheetData={sheetData} prefix="field_" />
                  );
                })}

                {/* 自定义字段 */}
                {customKeys.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-sm font-medium border-b pb-1">自定义字段</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {customKeys.map((key) => (
                        <div key={key} className="space-y-1.5">
                          <Label htmlFor={`field_${key}`} className="text-xs">{key}</Label>
                          <Input id={`field_${key}`} name={`field_${key}`}
                            defaultValue={String(sheetData[key] ?? "")} className="h-8 text-sm" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* 无模板时回退到原始 JSON 编辑 */
              <div className="border-t pt-4">
                <h3 className="font-semibold text-sm mb-3">角色数据</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(sheetData).map(([key, value]) => (
                    <div key={key} className="space-y-1.5">
                      <Label htmlFor={`field_${key}`} className="text-xs truncate">{key}</Label>
                      <Input id={`field_${key}`} name={`field_${key}`}
                        defaultValue={String(value)} className="h-8 text-sm" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 新增字段插槽 */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">添加新字段</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" id="new-fields-container">
                {[0, 1, 2].map((i) => (
                  <div key={`new_${i}`} className="space-y-1.5">
                    <Input name={`field_new_key_${i}`} placeholder="字段名" className="h-7 text-xs" />
                    <Input name={`field_new_val_${i}`} placeholder="值" className="h-8 text-sm" />
                  </div>
                ))}
              </div>
              <button type="button" id="add-field-btn"
                className="text-xs text-muted-foreground hover:text-primary transition-colors mt-2">
                + 添加更多字段
              </button>
            </div>

            <Button type="submit">保存修改</Button>
          </form>
        </CardContent>
      </Card>

      {/* 动态添加字段 JS */}
      <script dangerouslySetInnerHTML={{ __html: `
        document.getElementById('add-field-btn').addEventListener('click', function() {
          var c = document.getElementById('new-fields-container');
          var i = Date.now();
          var d = document.createElement('div');
          d.className = 'space-y-1.5';
          d.innerHTML = '<input class="flex h-7 w-full rounded-lg border border-input bg-background px-2.5 text-xs" name="field_new_key_'+i+'" placeholder="字段名"><input class="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm mt-1" name="field_new_val_'+i+'" placeholder="值">';
          c.appendChild(d);
        });
      `}} />
    </div>
  );
}
