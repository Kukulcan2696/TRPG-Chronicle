import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createCampaign } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewCampaignPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">创建战役</h1>
        <p className="text-muted-foreground">开始一段新的冒险</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>战役信息</CardTitle>
          <CardDescription>填写战役的基本信息</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createCampaign} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">战役名称</Label>
              <Input
                id="title"
                name="title"
                placeholder="例：龙与地下城：冰风谷"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL 标识</Label>
              <Input
                id="slug"
                name="slug"
                placeholder="icewind-dale"
                required
                pattern="[a-z0-9-]+"
              />
              <p className="text-xs text-muted-foreground">
                用于网址，仅限小写字母、数字和横线
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">简介</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="简要描述这个战役..."
                rows={4}
              />
            </div>
            <Button type="submit">创建战役</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}