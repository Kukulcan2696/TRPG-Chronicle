/**
 * API Key 管理页面
 *
 * 仅 ADMIN 角色可访问。
 * 功能：查看/生成/启用禁用/删除 API 密钥
 */

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Key, Plus, Trash2, Power, PowerOff } from "lucide-react";
import { GenerateKeyButton } from "./generate-button";
import { ToggleKeyButton } from "./toggle-button";
import { DeleteKeyButton } from "./delete-button";

export default async function ApiKeysPage() {
  const session = await auth();

  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/dashboard");
  }

  const apiKeys = await prisma.apiKey.findMany({
    orderBy: { createdAt: "desc" },
  });

  const formatDate = (d: Date | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("zh-CN");
  };

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Key className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">API 密钥</h1>
            <p className="text-sm text-muted-foreground">
              管理 Bot 集成使用的 API 密钥
            </p>
          </div>
        </div>
        <GenerateKeyButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">密钥列表</CardTitle>
          <CardDescription>
            密钥仅在生成时显示一次，请妥善保管。使用 SHA-256 哈希存储。
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {apiKeys.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              暂无 API 密钥，点击上方按钮生成
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-2 font-medium text-xs">名称</th>
                    <th className="text-left px-4 py-2 font-medium text-xs">前缀</th>
                    <th className="text-left px-4 py-2 font-medium text-xs">状态</th>
                    <th className="text-left px-4 py-2 font-medium text-xs hidden sm:table-cell">
                      创建时间
                    </th>
                    <th className="text-left px-4 py-2 font-medium text-xs hidden sm:table-cell">
                      最后使用
                    </th>
                    <th className="text-right px-4 py-2 font-medium text-xs">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map((k) => (
                    <tr key={k.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{k.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {k.prefix}…
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={k.enabled ? "default" : "secondary"}>
                          {k.enabled ? "启用" : "禁用"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                        {formatDate(k.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                        {formatDate(k.lastUsedAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <ToggleKeyButton id={k.id} enabled={k.enabled} />
                          <DeleteKeyButton id={k.id} name={k.name} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
