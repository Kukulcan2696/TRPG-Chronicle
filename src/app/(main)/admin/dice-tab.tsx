/**
 * 管理后台 — 掷骰记录管理标签
 */
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteDiceButton } from "./dice-delete-button";

const PAGE_SIZE = 20;

export async function DiceTab({ page, query }: { page: number; query: string }) {
  const where: any = {};
  if (query) {
    where.OR = [
      { formula: { contains: query } },
      { scene: { contains: query } },
      { reason: { contains: query } },
    ];
  }

  const [rolls, total] = await Promise.all([
    prisma.diceRoll.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        campaign: { select: { title: true } },
        user: { select: { name: true } },
        character: { select: { name: true } },
      },
    }),
    prisma.diceRoll.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const OUTCOME_BADGES: Record<string, string> = {
    CRITICAL_SUCCESS: "bg-amber-100 text-amber-800",
    SUCCESS: "bg-emerald-100 text-emerald-800",
    FAILURE: "bg-red-100 text-red-800",
    CRITICAL_FAILURE: "bg-red-200 text-red-900",
  };

  const OUTCOME_LABELS: Record<string, string> = {
    CRITICAL_SUCCESS: "大成功",
    SUCCESS: "成功",
    FAILURE: "失败",
    CRITICAL_FAILURE: "大失败",
  };

  return (
    <div>
      {/* 搜索 */}
      <form method="get" className="mb-4 flex gap-2">
        <input type="hidden" name="tab" value="dice" />
        <input
          name="q"
          defaultValue={query}
          placeholder="搜索公式、场景、检定原因..."
          className="flex h-9 w-full max-w-sm rounded-lg border border-input bg-background px-3 text-sm"
        />
        <Button type="submit" variant="outline" size="sm">搜索</Button>
        {query && (
          <a href="?tab=dice" className="inline-flex items-center text-xs text-muted-foreground hover:text-primary">
            清除
          </a>
        )}
      </form>

      {/* 表格 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-2 pr-4 font-medium">公式</th>
              <th className="py-2 pr-4 font-medium">结果</th>
              <th className="py-2 pr-4 font-medium hidden md:table-cell">判定</th>
              <th className="py-2 pr-4 font-medium hidden sm:table-cell">角色</th>
              <th className="py-2 pr-4 font-medium hidden lg:table-cell">用户</th>
              <th className="py-2 pr-4 font-medium hidden lg:table-cell">战役</th>
              <th className="py-2 pr-4 font-medium hidden xl:table-cell">原因</th>
              <th className="py-2 pr-4 font-medium hidden sm:table-cell">时间</th>
              <th className="py-2 font-medium w-12"></th>
            </tr>
          </thead>
          <tbody>
            {rolls.map((r) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50">
                <td className="py-2 pr-4 font-mono text-xs">{r.formula}</td>
                <td className="py-2 pr-4 font-bold">{r.result}</td>
                <td className="py-2 pr-4 hidden md:table-cell">
                  {r.outcome && (
                    <Badge className={OUTCOME_BADGES[r.outcome] || ""}>
                      {OUTCOME_LABELS[r.outcome] || r.outcome}
                    </Badge>
                  )}
                  {r.difficultyClass && !r.outcome && (
                    <span className="text-xs text-muted-foreground">DC{r.difficultyClass}</span>
                  )}
                </td>
                <td className="py-2 pr-4 hidden sm:table-cell text-xs">
                  {r.character?.name || "—"}
                </td>
                <td className="py-2 pr-4 hidden lg:table-cell text-xs">
                  {r.user?.name || "—"}
                </td>
                <td className="py-2 pr-4 hidden lg:table-cell text-xs">
                  {r.campaign.title}
                </td>
                <td className="py-2 pr-4 hidden xl:table-cell text-xs text-muted-foreground truncate max-w-32">
                  {r.reason || r.scene || "—"}
                </td>
                <td className="py-2 pr-4 hidden sm:table-cell text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(r.createdAt).toLocaleDateString("zh-CN")}
                </td>
                <td className="py-2">
                  <DeleteDiceButton rollId={r.id} />
                </td>
              </tr>
            ))}
            {rolls.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-muted-foreground">
                  {query ? "无匹配结果" : "暂无掷骰记录"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-muted-foreground">
            共 {total} 条，第 {page}/{totalPages} 页
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <a href={`?tab=dice&page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                 className="text-primary hover:underline">上一页</a>
            )}
            {page < totalPages && (
              <a href={`?tab=dice&page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                 className="text-primary hover:underline">下一页</a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
