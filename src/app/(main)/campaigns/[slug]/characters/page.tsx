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
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string }>;
}

const SYSTEM_LABELS: Record<string, string> = {
  DND5E: "D&D 5e",
  COC7: "CoC 7th",
  CUSTOM: "自定义",
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

export default async function CharactersPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { status: statusFilter } = await searchParams;
  const session = await auth();

  const campaign = await prisma.campaign.findUnique({
    where: { slug },
    select: { id: true, title: true },
  });
  if (!campaign) notFound();

  const where: any = { campaignId: campaign.id };
  if (statusFilter && ["DRAFT", "COMPLETE", "APPROVED"].includes(statusFilter)) {
    where.status = statusFilter;
  }

  const characters = await prisma.character.findMany({
    where,
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

      {/* 状态筛选 */}
      <div className="flex gap-2">
        <Link
          href={`/campaigns/${slug}/characters`}
          className={cn(
            "px-3 py-1 rounded-md text-xs font-medium transition-colors",
            !statusFilter ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
          )}
        >
          全部
        </Link>
        {Object.entries(STATUS_LABELS).map(([val, label]) => (
          <Link
            key={val}
            href={`/campaigns/${slug}/characters?status=${val}`}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium transition-colors border",
              statusFilter === val
                ? STATUS_STYLES[val]
                : "bg-muted hover:bg-muted/80 border-transparent"
            )}
          >
            {label}
          </Link>
        ))}
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
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary">
                      {SYSTEM_LABELS[char.system] || char.system}
                    </Badge>
                    <Badge className={STATUS_STYLES[char.status] || STATUS_STYLES.DRAFT}>
                      {STATUS_LABELS[char.status] || char.status}
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