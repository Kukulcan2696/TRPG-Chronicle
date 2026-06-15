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
import { Plus } from "lucide-react";

export default async function CampaignsPage() {
  const session = await auth();
  const campaigns = await prisma.campaign.findMany({
    where: {
      OR: [
        { dmId: session!.user!.id },
        { members: { some: { userId: session!.user!.id } } },
      ],
    },
    include: {
      dm: { select: { name: true } },
      _count: { select: { posts: true, characters: true, members: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">战役</h1>
          <p className="text-muted-foreground">管理你的所有跑团战役</p>
        </div>
        <Link href="/campaigns/new" className={buttonVariants()}>
          <Plus className="mr-2 h-4 w-4" />
          新战役
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((c) => (
          <Link key={c.id} href={`/campaigns/${c.slug}`}>
            <Card className="h-full hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle>{c.title}</CardTitle>
                <CardDescription>DM: {c.dm.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Badge variant="secondary">{c._count.posts} 战报</Badge>
                  <Badge variant="secondary">{c._count.characters} 角色</Badge>
                  <Badge variant="secondary">{c._count.members} 成员</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}