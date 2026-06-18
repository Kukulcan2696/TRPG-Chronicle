/**
 * 角色详情页 — 仿纸质角色卡风格
 *
 * 设计：
 * - 暖色羊皮纸质感背景
 * - 装饰性边框和分隔线
 * - 大号属性值展示
 * - 衬线体标题
 * - 响应式布局
 */
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { CHARACTER_TEMPLATES, type SheetField } from "@/lib/character-templates";
import { DeleteCharButton } from "@/components/character/delete-button";
import { Pencil, ArrowLeft } from "lucide-react";

interface PageProps { params: Promise<{ slug: string; charId: string }> }

const SYSTEM_LABELS: Record<string, string> = {
  DND5E: "D&D 5e", COC7: "CoC 7th", CUSTOM: "自定义",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "草稿",
  COMPLETE: "完成",
  APPROVED: "已批准",
};

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "border-amber-300 bg-amber-50 text-amber-700",
  COMPLETE: "border-emerald-300 bg-emerald-50 text-emerald-700",
  APPROVED: "border-blue-300 bg-blue-50 text-blue-700",
};

/** 查找字段值：兼容旧数据（sheet_ 前缀）和新数据（干净 key） */
function getFieldValue(sheetData: Record<string, any>, fieldKey: string, defaultValue?: string): string {
  return sheetData[fieldKey] ?? sheetData[`sheet_${fieldKey}`] ?? defaultValue ?? "—";
}

/** 渲染单个字段值（非 section 类型） */
function FieldDisplay({ field, sheetData }: { field: SheetField; sheetData: Record<string, any> }) {
  const val = getFieldValue(sheetData, field.key, field.defaultValue);
  if (field.type === "textarea") {
    return (
      <div className="col-span-full">
        <h5 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
          {field.label}
        </h5>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{val}</p>
      </div>
    );
  }
  if (field.type === "number") {
    return (
      <div className="text-center p-3 rounded-lg border-2 border-amber-200/60 bg-amber-50/50">
        <p className="text-2xl font-bold font-mono text-amber-900">{val}</p>
        <p className="text-xs text-stone-500 mt-0.5">{field.label}</p>
      </div>
    );
  }
  return (
    <div className="space-y-0.5">
      <h5 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
        {field.label}
      </h5>
      <p className="text-sm font-medium">{val}</p>
    </div>
  );
}

export default async function CharacterPage({ params }: PageProps) {
  const { slug, charId } = await params;
  const session = await auth();

  const character = await prisma.character.findUnique({
    where: { id: charId },
    include: {
      campaign: { select: { title: true, slug: true } },
      player: { select: { id: true, name: true, image: true } },
    },
  });

  const charBinding = await prisma.botBinding.findFirst({
    where: { characterId: charId },
    select: { platformId: true },
  });
  if (!character || character.campaign.slug !== slug) notFound();

  const template = CHARACTER_TEMPLATES.find((t) => t.id === character.system);
  const sheetData: Record<string, any> = JSON.parse(character.sheetData || "{}");
  const isOwner = session?.user?.id === character.playerId;
  const isDM = session?.user?.id === character.campaign.slug; // Will be checked in page

  // 分离 section 字段和普通字段
  const allFields = template?.fields ?? [];
  const customKeys = template
    ? Object.keys(sheetData).filter(
        (k) => !allFields.some((f) => {
          if (f.type === "section") return f.fields?.some((sf) => sf.key === k || `sheet_${sf.key}` === k);
          return f.key === k || `sheet_${f.key}` === k;
        })
      )
    : Object.keys(sheetData);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between">
        <Link
          href={`/campaigns/${slug}/characters`}
          className="inline-flex items-center text-sm text-stone-500 hover:text-stone-700 transition-colors"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回角色列表
        </Link>
        {isOwner && (
          <div className="flex gap-2">
            <Link
              href={`/campaigns/${slug}/characters/${charId}/edit`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Pencil className="mr-1 h-4 w-4" />
              编辑
            </Link>
            <DeleteCharButton campaignSlug={slug} charId={charId} />
          </div>
        )}
      </div>

      {/* ===== 角色卡主体 ===== */}
      <div className="rounded-xl border-2 border-amber-200/80 bg-gradient-to-b from-amber-50/80 via-orange-50/40 to-amber-50/80 shadow-lg overflow-hidden">
        {/* 顶部装饰条 */}
        <div className="h-2 bg-gradient-to-r from-amber-400 via-amber-600 to-amber-400" />

        {/* 头部：头像 + 名称 + 基本信息 */}
        <div className="px-6 sm:px-8 pt-6 pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <Avatar className="h-20 w-20 border-4 border-amber-200 shadow-md">
              <AvatarImage src={character.portrait || ""} />
              <AvatarFallback className="text-2xl bg-amber-100 text-amber-800 font-serif">
                {character.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl font-bold font-serif text-stone-800 tracking-tight">
                {character.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="secondary" className="font-normal">
                  {SYSTEM_LABELS[character.system] || character.system}
                </Badge>
                <Badge className={STATUS_STYLES[character.status] || STATUS_STYLES.DRAFT}>
                  {STATUS_LABELS[character.status] || character.status}
                </Badge>
                {charBinding && (
                  <Badge variant="outline" className="text-xs">
                    QQ: {charBinding.platformId}
                  </Badge>
                )}
                <span className="text-sm text-stone-500 ml-1">
                  by {character.player.name}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-8">
          <Separator className="bg-amber-200/60" />
        </div>

        {/* 背景故事 */}
        {character.bio && (
          <div className="px-6 sm:px-8 py-4">
            <div className="rounded-lg border border-amber-200/60 bg-amber-50/60 p-4 italic text-sm leading-relaxed text-stone-700">
              <span className="text-amber-600 text-lg leading-none mr-2 float-left font-serif">❝</span>
              {character.bio}
            </div>
          </div>
        )}

        {/* 属性区域 */}
        <div className="px-6 sm:px-8 py-4 space-y-6">
          {allFields.map((field) => {
            if (field.type === "section" && field.fields) {
              // 检查此 section 是否有数字字段（属性值块样式）
              const hasNumberFields = field.fields.some((f) => f.type === "number");
              return (
                <div key={field.key} className="space-y-3">
                  <h3 className="text-sm font-bold font-serif text-stone-700 border-b-2 border-amber-300/60 pb-1 uppercase tracking-wider">
                    {field.label}
                  </h3>
                  <div
                    className={
                      hasNumberFields
                        ? "grid grid-cols-3 sm:grid-cols-4 gap-3"
                        : "grid grid-cols-1 sm:grid-cols-2 gap-3"
                    }
                  >
                    {field.fields.map((f) => (
                      <FieldDisplay key={f.key} field={f} sheetData={sheetData} />
                    ))}
                  </div>
                </div>
              );
            }
            // 顶层非 section 字段
            return (
              <div key={field.key} className="space-y-3">
                <h3 className="text-sm font-bold font-serif text-stone-700 border-b-2 border-amber-300/60 pb-1 uppercase tracking-wider">
                  {field.label}
                </h3>
                <FieldDisplay field={field} sheetData={sheetData} />
              </div>
            );
          })}

          {/* 自定义字段（不在模板中的） */}
          {customKeys.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold font-serif text-stone-700 border-b-2 border-amber-300/60 pb-1 uppercase tracking-wider">
                自定义
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {customKeys.map((key) => (
                  <div key={key} className="text-center p-3 rounded-lg border border-dashed border-amber-200/60 bg-amber-50/30">
                    <p className="text-xl font-bold font-mono text-amber-900">
                      {String(sheetData[key] ?? "—")}
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">{key}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 无模板时的回退 */}
          {!template && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold font-serif text-stone-700 border-b-2 border-amber-300/60 pb-1 uppercase tracking-wider">
                角色数据
              </h3>
              <pre className="text-xs bg-stone-100 p-4 rounded-lg overflow-auto font-mono">
                {JSON.stringify(sheetData, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* 底部装饰条 */}
        <div className="h-2 bg-gradient-to-r from-amber-400 via-amber-600 to-amber-400 mt-4" />
      </div>

      {/* 底部元数据 */}
      <p className="text-center text-xs text-stone-400">
        创建于 {new Date(character.createdAt).toLocaleDateString("zh-CN")}
        {character.updatedAt !== character.createdAt &&
          ` · 更新于 ${new Date(character.updatedAt).toLocaleDateString("zh-CN")}`}
      </p>
    </div>
  );
}
