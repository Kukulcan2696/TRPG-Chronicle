import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollText, ArrowLeft } from "lucide-react";
import { CHARACTER_TEMPLATES } from "@/lib/character-templates";

interface PageProps {
  params: Promise<{ slug: string; charId: string }>;
}

const SYSTEM_LABELS: Record<string, string> = {
  DND5E: "D&D 5e",
  COC7: "CoC 7th",
  CUSTOM: "自定义",
};

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

  function renderField(field: any, value: any) {
    if (field.type === "section") return null;

    const displayValue = value ?? field.defaultValue ?? "";
    
    switch (field.type) {
      case "textarea":
        return (
          <div className="col-span-full space-y-1">
            <Label className="text-xs text-muted-foreground">{field.label}</Label>
            <p className="text-sm whitespace-pre-wrap">{displayValue || "—"}</p>
          </div>
        );
      case "select": {
        const option = field.options?.find((o: any) => o.value === displayValue);
        return (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{field.label}</Label>
            <p className="text-sm font-medium">{option?.label || displayValue || "—"}</p>
          </div>
        );
      }
      default:
        return (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{field.label}</Label>
            <p className="text-sm font-medium">{displayValue || "—"}</p>
          </div>
        );
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href={`/campaigns/${slug}/characters`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        返回角色列表
      </Link>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={character.portrait || ""} />
            <AvatarFallback className="text-xl">
              {character.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{character.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">
                {SYSTEM_LABELS[character.system] || character.system}
              </Badge>
              <span className="text-sm text-muted-foreground">
                by {character.player.name}
              </span>
            </div>
          </div>
        </div>
        {isOwner && (
          <Button variant="outline" asChild>
            <Link href={`/campaigns/${slug}/characters/${charId}/edit`}>
              编辑
            </Link>
          </Button>
        )}
      </div>

      {character.bio && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">背景</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{character.bio}</p>
          </CardContent>
        </Card>
      )}

      {template && template.fields.length > 0 && (
        <Tabs defaultValue="stats" className="space-y-4">
          <TabsList>
            {template.fields.map((section) => (
              <TabsTrigger key={section.key} value={section.key}>
                {section.label}
              </TabsTrigger>
            ))}
            <TabsTrigger value="raw">原始数据</TabsTrigger>
          </TabsList>

          {template.fields.map((section) => (
            <TabsContent key={section.key} value={section.key}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{section.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {section.fields?.map((field) => (
                      <div key={field.key}>
                        {renderField(field, sheetData[field.key])}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}

          <TabsContent value="raw">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">原始数据</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
                  {JSON.stringify(sheetData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}