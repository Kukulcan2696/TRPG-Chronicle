/**
 * 创建角色页面 — 多入口（模板 / 空白 / 复制 / 导入）
 */
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createCharacter } from "./actions";
import { CHARACTER_TEMPLATES, type SheetField } from "@/lib/character-templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PortraitUpload } from "@/components/media/portrait-upload";
import { cn } from "@/lib/utils";

interface PageProps { params: Promise<{ slug: string }> }

const MODES = [
  { key: "template", label: "从模板创建", desc: "选择 TRPG 规则系统，填写预设字段" },
  { key: "blank", label: "空白创建", desc: "仅填写名字和系统，后续在编辑页补数据" },
  { key: "copy", label: "复制角色", desc: "基于已有角色创建副本" },
  { key: "import", label: "JSON 导入", desc: "粘贴 sheetData JSON 直接导入" },
];

function RenderField({ field }: { field: SheetField }) {
  if (field.type === "section") {
    return (
      <div className="space-y-3 pt-4 first:pt-0">
        <h3 className="font-semibold text-sm border-b pb-1">{field.label}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {field.fields?.map((f) => (<RenderField key={f.key} field={f} />))}
        </div>
      </div>
    );
  }
  if (field.type === "textarea") {
    return (
      <div className="col-span-full space-y-1.5">
        <Label htmlFor={`field_${field.key}`} className="text-xs">{field.label}</Label>
        <Textarea id={`field_${field.key}`} name={`field_${field.key}`} placeholder={field.placeholder} rows={3} className="text-sm" defaultValue={field.defaultValue} />
      </div>
    );
  }
  if (field.type === "select") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={`field_${field.key}`} className="text-xs">{field.label}</Label>
        <select id={`field_${field.key}`} name={`field_${field.key}`} className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm" defaultValue={field.defaultValue}>
          {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`field_${field.key}`} className="text-xs">{field.label}</Label>
      <Input id={`field_${field.key}`} name={`field_${field.key}`} type={field.type} placeholder={field.placeholder} defaultValue={field.defaultValue} className="h-8 text-sm" />
    </div>
  );
}

export default async function NewCharacterPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth();

  const campaign = await prisma.campaign.findUnique({
    where: { slug }, select: { id: true, title: true },
  });
  if (!campaign) notFound();

  // 获取战役中当前用户的角色列表（用于复制模式）
  const myCharacters = session?.user?.id
    ? await prisma.character.findMany({
        where: { campaignId: campaign.id, playerId: session.user.id },
        select: { id: true, name: true, system: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">创建角色</h1>
        <p className="text-muted-foreground">为「{campaign.title}」创建新角色</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {/* ===== 入口选择 ===== */}
          <div className="flex gap-2 mb-6 flex-wrap" id="mode-selector">
            {MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                data-mode={m.key}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors border",
                  m.key === "template"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted hover:bg-muted/80 border-transparent"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          <form action={createCharacter.bind(null, slug)} className="space-y-6">
            {/* 模式隐藏字段 */}
            <input type="hidden" name="_mode" id="create-mode" value="template" />

            {/* ===== 公共字段 ===== */}
            <div className="space-y-2">
              <Label>角色头像</Label>
              <PortraitUpload name="portrait" width={200} height={200} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">角色名</Label>
              <Input id="name" name="name" placeholder="例：甘道夫·灰袍" required />
            </div>

            {/* ===== 模板模式：系统选择 + 模板字段 ===== */}
            <div id="panel-template" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="systemSelect">规则系统</Label>
                <select id="systemSelect" name="system" className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm" defaultValue="CUSTOM">
                  {CHARACTER_TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name} - {t.description}</option>)}
                </select>
              </div>

              {CHARACTER_TEMPLATES.map((template) => (
                <div key={template.id} id={`template-${template.id}`} className={template.id === "CUSTOM" ? "" : "hidden"} data-template={template.id}>
                  {template.id !== "CUSTOM" && <h3 className="font-bold text-sm mb-3">{template.name} 属性</h3>}
                  {template.fields.map((field) => (<RenderField key={field.key} field={field} />))}
                </div>
              ))}
            </div>

            {/* ===== 空白模式 ===== */}
            <div id="panel-blank" className="hidden space-y-2">
              <Label htmlFor="systemBlank">规则系统</Label>
              <select id="systemBlank" name="system_blank" className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm" defaultValue="CUSTOM">
                {CHARACTER_TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name} - {t.description}</option>)}
              </select>
              <p className="text-xs text-muted-foreground">创建空角色卡，之后在编辑页补充数据。</p>
            </div>

            {/* ===== 复制模式 ===== */}
            <div id="panel-copy" className="hidden space-y-2">
              <Label htmlFor="copySource">选择要复制的角色</Label>
              {myCharacters.length > 0 ? (
                <select id="copySource" name="copySource" className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
                  {myCharacters.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} [{c.system}]</option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-muted-foreground">你在此战役还没有角色，请先用其他方式创建。</p>
              )}
              <p className="text-xs text-muted-foreground">将复制角色的名称（加"副本"后缀）、系统、属性和简介。</p>
            </div>

            {/* ===== JSON 导入模式 ===== */}
            <div id="panel-import" className="hidden space-y-2">
              <Label htmlFor="importSystem">规则系统</Label>
              <select id="importSystem" name="import_system" className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm" defaultValue="CUSTOM">
                {CHARACTER_TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name} - {t.description}</option>)}
              </select>
              <Label htmlFor="importJson">sheetData JSON</Label>
              <Textarea id="importJson" name="importJson" placeholder={'{"STR":"12","DEX":"14",...}'} rows={6} className="font-mono text-xs" />
              <p className="text-xs text-muted-foreground">直接粘贴 JSON，示例：{`{"STR":"15","DEX":"12"}`}</p>
            </div>

            {/* ===== 公共字段（续） ===== */}
            <div className="space-y-2">
              <Label htmlFor="bio">背景简介</Label>
              <Textarea id="bio" name="bio" placeholder="角色的背景故事概要..." rows={3} />
            </div>

            <div className="flex items-center gap-2">
              <Switch id="isPublic" name="isPublic" value="true" defaultChecked />
              <Label htmlFor="isPublic">公开角色卡</Label>
            </div>

            <Button type="submit">创建角色</Button>
          </form>
        </CardContent>
      </Card>

      {/* ===== 客户端 JS ===== */}
      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
          var ACTIVE = 'bg-primary text-primary-foreground border-primary';
          var INACTIVE = 'bg-muted hover:bg-muted/80 border-transparent';

          // 模式切换
          document.querySelectorAll('#mode-selector [data-mode]').forEach(function(btn) {
            btn.addEventListener('click', function() {
              var mode = this.dataset.mode;
              document.getElementById('create-mode').value = mode;
              // 按钮样式
              document.querySelectorAll('#mode-selector [data-mode]').forEach(function(b) {
                b.className = b.className.replace(ACTIVE, INACTIVE);
              });
              this.className = this.className.replace(INACTIVE, ACTIVE);
              // 面板切换
              ['template','blank','copy','import'].forEach(function(p) {
                var panel = document.getElementById('panel-' + p);
                if (panel) panel.className = p === mode ? 'space-y-4' : 'hidden';
              });
            });
          });

          // 模板系统切换
          var sysSelect = document.getElementById('systemSelect');
          if (sysSelect) {
            sysSelect.addEventListener('change', function() {
              document.querySelectorAll('[data-template]').forEach(function(el) { el.classList.add('hidden'); });
              var target = document.getElementById('template-' + this.value);
              if (target) target.classList.remove('hidden');
            });
          }
        })();
      `}} />
    </div>
  );
}
