/**
 * 管理后台 — 战报管理标签
 */
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeletePostButton } from "./post-delete-button";

const PAGE_SIZE = 15;

export async function PostsTab({ page, query }: { page: number; query: string }) {
  const where: any = {};
  if (query) {
    where.OR = [
      { title: { contains: query } },
      { content: { contains: query } },
    ];
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        campaign: { select: { title: true, slug: true } },
        author: { select: { name: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <form method="get" className="mb-4 flex gap-2">
        <input type="hidden" name="tab" value="posts" />
        <input name="q" defaultValue={query} placeholder="搜索标题、内容..." className="flex h-9 w-full max-w-sm rounded-lg border border-input bg-background px-3 text-sm" />
        <Button type="submit" variant="outline" size="sm">搜索</Button>
        {query && <a href="?tab=posts" className="inline-flex items-center text-xs text-muted-foreground hover:text-primary">清除</a>}
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-2 pr-4 font-medium">标题</th>
              <th className="py-2 pr-4 font-medium hidden sm:table-cell">状态</th>
              <th className="py-2 pr-4 font-medium hidden md:table-cell">作者</th>
              <th className="py-2 pr-4 font-medium hidden lg:table-cell">战役</th>
              <th className="py-2 pr-4 font-medium hidden sm:table-cell">发表时间</th>
              <th className="py-2 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50">
                <td className="py-2 pr-4 font-medium truncate max-w-xs">{p.title}</td>
                <td className="py-2 pr-4 hidden sm:table-cell">
                  <Badge variant={p.published ? "default" : "secondary"} className="text-xs">
                    {p.published ? "已发布" : "草稿"}
                  </Badge>
                </td>
                <td className="py-2 pr-4 hidden md:table-cell text-xs">{p.author?.name ?? "—"}</td>
                <td className="py-2 pr-4 hidden lg:table-cell text-xs">{p.campaign.title}</td>
                <td className="py-2 pr-4 hidden sm:table-cell text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(p.createdAt).toLocaleDateString("zh-CN")}
                </td>
                <td className="py-2">
                  <DeletePostButton postId={p.id} postTitle={p.title} />
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">无匹配战报</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-muted-foreground">共 {total} 条，第 {page}/{totalPages} 页</span>
          <div className="flex gap-2">
            {page > 1 && <a href={`?tab=posts&page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`} className="text-primary hover:underline">上一页</a>}
            {page < totalPages && <a href={`?tab=posts&page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`} className="text-primary hover:underline">下一页</a>}
          </div>
        </div>
      )}
    </div>
  );
}
