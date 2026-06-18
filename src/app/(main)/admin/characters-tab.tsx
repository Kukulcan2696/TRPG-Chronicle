/**
 * 管理后台 — 角色管理标签
 */
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteCharButton } from "./char-delete-button";
import { CharStatusSelect } from "./char-status-select";

const PAGE_SIZE = 15;

export async function CharactersTab({ page, query }: { page: number; query: string }) {
  const where: any = {};
  if (query) {
    where.OR = [
      { name: { contains: query } },
      { system: { contains: query } },
    ];
  }

  const [characters, total] = await Promise.all([
    prisma.character.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        campaign: { select: { title: true, slug: true } },
        player: { select: { id: true, name: true } },
      },
    }),
    prisma.character.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <form method="get" className="mb-4 flex gap-2">
        <input type="hidden" name="tab" value="characters" />
        <input name="q" defaultValue={query} placeholder="搜索角色名、系统..." className="flex h-9 w-full max-w-sm rounded-lg border border-input bg-background px-3 text-sm" />
        <Button type="submit" variant="outline" size="sm">搜索</Button>
        {query && <a href="?tab=characters" className="inline-flex items-center text-xs text-muted-foreground hover:text-primary">清除</a>}
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-2 pr-4 font-medium">角色名</th>
              <th className="py-2 pr-4 font-medium hidden sm:table-cell">系统</th>
              <th className="py-2 pr-4 font-medium hidden md:table-cell">状态</th>
              <th className="py-2 pr-4 font-medium hidden md:table-cell">玩家</th>
              <th className="py-2 pr-4 font-medium hidden lg:table-cell">战役</th>
              <th className="py-2 pr-4 font-medium hidden sm:table-cell">更新</th>
              <th className="py-2 font-medium w-28">操作</th>
            </tr>
          </thead>
          <tbody>
            {characters.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50">
                <td className="py-2 pr-4">
                  <a href={`/campaigns/${c.campaign.slug}/characters/${c.id}`}
                     className="font-medium text-primary hover:underline" target="_blank">
                    {c.name}
                  </a>
                </td>
                <td className="py-2 pr-4 hidden sm:table-cell">
                  <Badge variant="secondary" className="text-xs">{c.system}</Badge>
                </td>
                <td className="py-2 pr-4 hidden md:table-cell">
                  <CharStatusSelect charId={c.id} currentStatus={c.status} />
                </td>
                <td className="py-2 pr-4 hidden md:table-cell text-xs">{c.player.name}</td>
                <td className="py-2 pr-4 hidden lg:table-cell text-xs">
                  <a href={`/campaigns/${c.campaign.slug}`} className="hover:underline" target="_blank">
                    {c.campaign.title}
                  </a>
                </td>
                <td className="py-2 pr-4 hidden sm:table-cell text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(c.updatedAt).toLocaleDateString("zh-CN")}
                </td>
                <td className="py-2">
                  <DeleteCharButton charId={c.id} charName={c.name} />
                </td>
              </tr>
            ))}
            {characters.length === 0 && (
              <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">无匹配角色</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-muted-foreground">共 {total} 条，第 {page}/{totalPages} 页</span>
          <div className="flex gap-2">
            {page > 1 && <a href={`?tab=characters&page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`} className="text-primary hover:underline">上一页</a>}
            {page < totalPages && <a href={`?tab=characters&page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`} className="text-primary hover:underline">下一页</a>}
          </div>
        </div>
      )}
    </div>
  );
}
