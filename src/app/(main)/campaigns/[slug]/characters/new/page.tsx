/**
 * 创建角色页面（弹窗模式）
 * 
 * 功能：
 * - 选择 TRPG 规则系统（D&D 5e / CoC 7th / 自定义）
 * - 根据选择的系统动态显示对应的属性字段
 * - 上传角色头像（调用 ImageUpload 组件）
 * - 填写角色名、背景简介、公开/隐藏设置
 * 
 * 技术要点：
 * - ImageUpload 是客户端组件，用隐藏 input 将 portrait URL 传回 Server Action
 * - 模板系统通过 JS 切换 data-template 的显示/隐藏
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

interface PageProps { params: Promise<{ slug: string }> }

// 渲染单个模板字段
function RenderField({ field }: { field: SheetField }) {
  if (field.type === "section") {
    return (
      <div className="space-y-3 pt-4 first:pt-0">
        <h3 className="font-semibold text-sm border-b pb-1">{field.label}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {field.fields?.map((f) => (
            <RenderField key={f.key} field={f} />
          ))}
        </div>
      </div>
    );
  }
  if (field.type === "textarea") {
    return (
      <div className="col-span-full space-y-1.5">
        <Label htmlFor={`sheet_${field.key}`} className="text-xs">{field.label}</Label>
        <Textarea id={`sheet_${field.key}`} name={`sheet_${field.key}`} placeholder={field.placeholder} rows={3} className="text-sm" defaultValue={field.defaultValue} />
      </div>
    );
  }
  if (field.type === "select") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={`sheet_${field.key}`} className="text-xs">{field.label}</Label>
        <select id={`sheet_${field.key}`} name={`sheet_${field.key}`} className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm" defaultValue={field.defaultValue}>
          {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`sheet_${field.key}`} className="text-xs">{field.label}</Label>
      <Input id={`sheet_${field.key}`} name={`sheet_${field.key}`} type={field.type} placeholder={field.placeholder} defaultValue={field.defaultValue} className="h-8 text-sm" />
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">创建角色</h1>
        <p className="text-muted-foreground">为「{campaign.title}」创建新角色</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {/* 
            Server Action 表单
            createCharacter.bind(null, slug) 将 campaignSlug 预绑定为第一个参数
          */}
          <form action={createCharacter.bind(null, slug)} className="space-y-6">
            {/* ===== 头像上传区域 ===== */}
            <div className="space-y-2">
              <Label>角色头像</Label>
              <PortraitUpload name="portrait" width={200} height={200} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">角色名</Label>
              <Input id="name" name="name" placeholder="例：甘道夫·灰袍" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemSelect">规则系统</Label>
              <select id="systemSelect" name="system" className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm" defaultValue="CUSTOM">
                {CHARACTER_TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name} - {t.description}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">背景简介</Label>
              <Textarea id="bio" name="bio" placeholder="角色的背景故事概要..." rows={3} />
            </div>

            <div className="flex items-center gap-2">
              <Switch id="isPublic" name="isPublic" value="true" defaultChecked />
              <Label htmlFor="isPublic">公开角色卡</Label>
            </div>

            {/* 模板字段 */}
            <div className="border-t pt-4">
              {CHARACTER_TEMPLATES.map((template) => (
                <div key={template.id} id={`template-${template.id}`} className={template.id === "CUSTOM" ? "" : "hidden"} data-template={template.id}>
                  {template.id !== "CUSTOM" && <h3 className="font-bold text-sm mb-3">{template.name} 属性</h3>}
                  {template.fields.map((field) => (
                    <RenderField key={field.key} field={field} />
                  ))}
                </div>
              ))}
            </div>

            <Button type="submit">创建角色</Button>
          </form>
        </CardContent>
      </Card>

      {/* 客户端 JS：切换规则时显示对应模板 */}
      <script dangerouslySetInnerHTML={{ __html: `
        document.getElementById('systemSelect').addEventListener('change', function() {
          document.querySelectorAll('[data-template]').forEach(function(el) { el.classList.add('hidden'); });
          var target = document.getElementById('template-' + this.value);
          if (target) target.classList.remove('hidden');
        });
      `}} />
    </div>
  );
}