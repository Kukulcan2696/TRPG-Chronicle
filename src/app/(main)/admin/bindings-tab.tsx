/**
 * 管理后台 — 绑定管理标签（BotBinding + GroupBinding）
 */
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteBindingButton } from "./binding-delete-button";

const PAGE_SIZE = 15;

export async function BindingsTab({ page, query }: { page: number; query: string }) {
  const botWhere: any = {};
  const groupWhere: any = {};
  if (query) {
    botWhere.OR = [
      { platformId: { contains: query } },
      { user: { name: { contains: query } } },
    ];
    groupWhere.OR = [
      { groupId: { contains: query } },
      { campaign: { title: { contains: query } } },
    ];
  }

  const [botBindings, botTotal, groupBindings, groupTotal] = await Promise.all([
    prisma.botBinding.findMany({
      where: botWhere,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        user: { select: { name: true, email: true } },
        character: { select: { name: true } },
        campaign: { select: { title: true } },
      },
    }),
    prisma.botBinding.count({ where: botWhere }),
    prisma.groupBinding.findMany({
      where: groupWhere,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        campaign: { select: { title: true, slug: true } },
      },
    }),
    prisma.groupBinding.count({ where: groupWhere }),
  ]);

  const totalPages = Math.ceil(Math.max(botTotal, groupTotal) / PAGE_SIZE);

  return (
    <div>
      {/* 搜索 */}
      <form method="get" className="mb-4 flex gap-2">
        <input type="hidden" name="tab" value="bindings" />
        <input name="q" defaultValue={query} placeholder="搜索 QQ号/群号/用户名/战役..." className="flex h-9 w-full max-w-sm rounded-lg border border-input bg-background px-3 text-sm" />
        <Button type="submit" variant="outline" size="sm">搜索</Button>
        {query && <a href="?tab=bindings" className="inline-flex items-center text-xs text-muted-foreground hover:text-primary">清除</a>}
      </form>

      <div className="space-y-8">
        {/* QQ 用户绑定 */}
        <div>
          <h3 className="font-semibold mb-3">QQ 用户绑定 ({botTotal})</h3>
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
                    <td className="py-2 pr-4 hidden lg:table-cell text-xs">
                      {b.campaign?.title ? (
                        <a href={`/campaigns/${b.campaignId}`} className="hover:underline" target="_blank">{b.campaign.title}</a>
                      ) : "—"}
                    </td>
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
          <h3 className="font-semibold mb-3">QQ 群绑定 ({groupTotal})</h3>
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
                    <td className="py-2 pr-4 text-xs">
                      <a href={`/campaigns/${b.campaign.slug}`} className="text-primary hover:underline" target="_blank">
                        {b.campaign.title}
                      </a>
                      <span className="text-muted-foreground ml-1">({b.campaign.slug})</span>
                    </td>
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

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-muted-foreground">第 {page}/{totalPages} 页</span>
          <div className="flex gap-2">
            {page > 1 && <a href={`?tab=bindings&page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`} className="text-primary hover:underline">上一页</a>}
            {page < totalPages && <a href={`?tab=bindings&page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`} className="text-primary hover:underline">下一页</a>}
          </div>
        </div>
      )}
    </div>
  );
}
