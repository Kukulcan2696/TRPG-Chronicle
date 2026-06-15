import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarPlus, Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { RSVPButtons } from "@/components/schedule/rsvp-buttons";

interface PageProps { params: Promise<{ slug: string }> }

const RSVP_LABELS: Record<string, string> = { GOING: "参加", MAYBE: "待定", CANT: "缺席", PENDING: "待回复" };
const RSVP_COLORS: Record<string, string> = { GOING: "default", MAYBE: "secondary", CANT: "destructive", PENDING: "outline" };

export default async function SchedulePage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth();

  const campaign = await prisma.campaign.findUnique({
    where: { slug },
    select: { id: true, title: true, dmId: true },
  });
  if (!campaign) notFound();

  const events = await prisma.scheduleEvent.findMany({
    where: { campaignId: campaign.id },
    orderBy: { scheduledAt: "asc" },
    include: {
      creator: { select: { name: true } },
      rsvps: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  const isDM = session?.user?.id === campaign.dmId;
  const now = new Date();

  return (<div className="space-y-6">
    <div className="flex items-center justify-between">
      <div><h1 className="text-2xl font-bold">跑团排期</h1><p className="text-muted-foreground"><Link href={`/campaigns/${slug}`} className="hover:text-primary">{campaign.title}</Link></p></div>
      {isDM && <Link href={`/campaigns/${slug}/schedule/new`} className={buttonVariants()}><CalendarPlus className="mr-2 h-4 w-4" />安排场次</Link>}
    </div>
    {events.length === 0 ? (
      <Card className="text-center py-12"><CardContent><Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-semibold mb-2">还没有排期</h3><p className="text-muted-foreground">安排下一次跑团</p></CardContent></Card>
    ) : (
      <div className="space-y-3">
        {events.map((event) => {
          const userRSVP = event.rsvps.find((r) => r.userId === session?.user?.id);
          return (
            <Card key={event.id} className={new Date(event.scheduledAt) < now ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{format(new Date(event.scheduledAt), "yyyy年M月d日 EEEE HH:mm", { locale: zhCN })}</p>
                    {event.location && <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</p>}
                  </div>
                  {userRSVP && <Badge variant={RSVP_COLORS[userRSVP.status] as any}>{RSVP_LABELS[userRSVP.status]}</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 flex-wrap">
                    {event.rsvps.map((rsvp) => (
                      <Badge key={rsvp.userId} variant={RSVP_COLORS[rsvp.status] as any} className="text-xs">{rsvp.user.name}: {RSVP_LABELS[rsvp.status]}</Badge>
                    ))}
                  </div>
                  <RSVPButtons campaignSlug={slug} eventId={event.id} currentStatus={userRSVP?.status ?? null} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    )}
  </div>);
}