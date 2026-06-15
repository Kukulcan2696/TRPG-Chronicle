/**
 * 战役编辑页（弹窗模式）
 * 
 * 功能：
 * - 编辑战役标题、简介
 * - 上传/更换封面图（ImageUpload 组件）
 * - 删除战役（DM 专属）
 * 
 * 安全：仅 DM 可以访问此页面
 */
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateCampaign } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteCampaignButton } from "@/components/campaign/delete-button";
import { PortraitUpload } from "@/components/media/portrait-upload";

interface PageProps { params: Promise<{ slug: string }> }

export default async function EditCampaignPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth();

  // 仅 DM 可编辑
  const campaign = await prisma.campaign.findUnique({ where: { slug } });
  if (!campaign || campaign.dmId !== session?.user?.id) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">编辑战役</h1>
        <p className="text-muted-foreground">{campaign.title}</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action={updateCampaign.bind(null, slug)} className="space-y-4">
            {/* ===== 封面图上传 ===== */}
            <div className="space-y-2">
              <Label>战役封面</Label>
              <PortraitUpload name="coverImage" currentUrl={campaign.coverImage} width={400} height={200} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">战役名称</Label>
              <Input id="title" name="title" defaultValue={campaign.title} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">简介</Label>
              <Textarea id="description" name="description" rows={4} defaultValue={campaign.description || ""} />
            </div>

            <div className="flex justify-between">
              <Button type="submit">保存修改</Button>
              <DeleteCampaignButton slug={slug} />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}