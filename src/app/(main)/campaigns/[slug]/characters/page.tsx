import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Plus } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const SYSTEM_LABELS: Record<string, string> = {
  DND5E: "D&D 5e",
  COC7: "CoC 7th",
  CUSTOM: "自定义",
};

export default async function CharactersPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth();

  const campaign = await prisma.campaign.findUnique({
    where: { slug },
    select: { id: true, title: true },
  });
  if (!campaign) notFound();

  const characters = await prisma.character.findMany({
    where: { campaignId: campaign.id },
    orderBy: { createdAt: "desc" },
    include: {
      player: { select: { name: true, image: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">角色</h1>
          <p className="text-muted-foreground">
            <Link
              href={`/campaigns/${slug}`}
              className="hover:text-primary transition-colors"
            >
              {campaign.title}
            </Link>{" "}
            · {characters.length} 个角色
          </p>
        </div>
        <Link
          href={`/campaigns/${slug}/characters/new`}
          className={buttonVariants()}
        >
          <Plus className="mr-2 h-4 w-4" />
          创建角色
        </Link>
      </div>

      {characters.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">还没有角色</h3>
            <p className="text-muted-foreground mb-4">
              创建第一个角色卡，开始你的冒险
            </p>
            <Link
              href={`/campaigns/${slug}/characters/new`}
              className={buttonVariants()}
            >
              创建角色
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((char) => (
            <Link
              key={char.id}
              href={`/campaigns/${slug}/characters/${char.id}`}
            >
              <Card className="h-full hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={char.portrait || ""} />
                      <AvatarFallback>
                        {char.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{char.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <span>{char.player.name}</span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      {SYSTEM_LABELS[char.system] || char.system}
                    </Badge>
                    {!char.isPublic && (
                      <Badge variant="outline">隐藏</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}