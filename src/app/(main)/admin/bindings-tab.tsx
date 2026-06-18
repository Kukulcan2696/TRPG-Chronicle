/**
 * 管理后台 — 绑定管理标签（BotBinding + GroupBinding）
 */
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteBindingButton } from "./binding-delete-button";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function BindingsTab() {
  const [botBindings, groupBindings] = await Promise.all([
    prisma.botBinding.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        character: { select: { name: true } },
        campaign: { select: { title: true } },
      },
    }),
    prisma.groupBinding.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        campaign: { select: { title: true, slug: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* QQ 用户绑定 */}
      <div>
        <h3 className="font-semibold mb-3">QQ 用户绑定 ({botBindings.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="py-2 pr-4">QQ 号</th>
                <th className="py-2 pr-4 hidden sm:table-cell">平台用户</th>
                <th className="py-2 pr-4 hidden md:table-cell">邮箱</th>
                <th className="py-2 pr-4 hidden lg:table-cell">关联角色</th>
                <th className="py-2 pr-4 hidden lg:table-cell">关联战役</th>
                <th className="py-2 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {botBindings.map((b) => (
                <tr key={b.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="py-2 pr-4 font-mono text-xs">{b.platformId}</td>
                  <td className="py-2 pr-4 hidden sm:table-cell font-medium">{b.user.name || "—"}</td>
                  <td className="py-2 pr-4 hidden md:table-cell text-xs text-muted-foreground">{b.user.email}</td>
                  <td className="py-2 pr-4 hidden lg:table-cell text-xs">
                    {b.character ? (
                      <Badge variant="secondary" className="text-xs">{b.character.name}</Badge>
                    ) : "—"}
                  </td>
                  <td className="py-2 pr-4 hidden lg:table-cell text-xs">{b.campaign?.title || "—"}</td>
                  <td className="py-2">
                    <DeleteBindingButton id={b.id} type="bot" label={`QQ ${b.platformId} → ${b.user.name || "?"}`} />
                  </td>
                </tr>
              ))}
              {botBindings.length === 0 && (
                <tr><td colSpan={6} className="py-4 text-center text-muted-foreground">暂无 QQ 用户绑定</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QQ 群绑定 */}
      <div>
        <h3 className="font-semibold mb-3">QQ 群绑定 ({groupBindings.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="py-2 pr-4">QQ 群号</th>
                <th className="py-2 pr-4">战役</th>
                <th className="py-2 pr-4 hidden sm:table-cell">创建时间</th>
                <th className="py-2 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {groupBindings.map((b) => (
                <tr key={b.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="py-2 pr-4 font-mono text-xs">{b.groupId}</td>
                  <td className="py-2 pr-4 text-xs">{b.campaign.title} <span className="text-muted-foreground">({b.campaign.slug})</span></td>
                  <td className="py-2 pr-4 hidden sm:table-cell text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(b.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="py-2">
                    <DeleteBindingButton id={b.id} type="group" label={`群 ${b.groupId} → ${b.campaign.title}`} />
                  </td>
                </tr>
              ))}
              {groupBindings.length === 0 && (
                <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">暂无群绑定</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
