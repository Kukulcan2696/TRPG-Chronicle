/**
 * 角色详情页（弹窗模式）
 */
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CHARACTER_TEMPLATES } from "@/lib/character-templates";
import { DeleteCharButton } from "@/components/character/delete-button";
import { ArrowLeft, Pencil } from "lucide-react";

interface PageProps { params: Promise<{ slug: string; charId: string }> }
const SYSTEM_LABELS: Record<string, string> = { DND5E: "D&D 5e", COC7: "CoC 7th", CUSTOM: "自定义" };

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
  if (!character || character.campaign.slug !== slug) notFound();

  const template = CHARACTER_TEMPLATES.find((t) => t.id === character.system);
  const sheetData: Record<string, any> = JSON.parse(character.sheetData || "{}");
  const isOwner = session?.user?.id === character.playerId;

  return (<div className="max-w-4xl mx-auto space-y-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16"><AvatarImage src={character.portrait || ""} /><AvatarFallback className="text-xl">{character.name.charAt(0)}</AvatarFallback></Avatar>
        <div><h1 className="text-3xl font-bold">{character.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">{SYSTEM_LABELS[character.system] || character.system}</Badge>
            <span className="text-sm text-muted-foreground">by {character.player.name}</span>
          </div>
        </div>
      </div>
      {isOwner && (<div className="flex gap-2">
        <Link href={`/campaigns/${slug}/characters/${charId}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}><Pencil className="mr-1 h-4 w-4" />编辑</Link>
        <DeleteCharButton campaignSlug={slug} charId={charId} />
      </div>)}
    </div>
    {character.bio && <Card><CardHeader><CardTitle className="text-sm">背景</CardTitle></CardHeader><CardContent><p className="text-sm">{character.bio}</p></CardContent></Card>}
    {template && <Tabs defaultValue="stats"><TabsList>{template.fields.map((s) => <TabsTrigger key={s.key} value={s.key}>{s.label}</TabsTrigger>)}<TabsTrigger value="raw">原始数据</TabsTrigger></TabsList>
      {template.fields.map((section) => (<TabsContent key={section.key} value={section.key}><Card><CardHeader><CardTitle className="text-lg">{section.label}</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{section.fields?.map((field) => (<div key={field.key} className="space-y-1"><span className="text-xs text-muted-foreground">{field.label}</span><p className="text-sm font-medium">{sheetData[field.key] || field.defaultValue || "—"}</p></div>))}</div></CardContent></Card></TabsContent>))}
      <TabsContent value="raw"><Card><CardHeader><CardTitle className="text-lg">原始数据</CardTitle></CardHeader><CardContent><pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">{JSON.stringify(sheetData, null, 2)}</pre></CardContent></Card></TabsContent>
    </Tabs>}
  </div>);
}