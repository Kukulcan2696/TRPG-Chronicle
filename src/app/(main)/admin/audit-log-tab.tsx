/**
 * 管理后台 — 操作日志标签（支持筛选和搜索）
 */
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 20;

const ACTION_LABELS: Record<string, string> = {
  DELETE_CAMPAIGN: "删除战役",
  CHANGE_ROLE: "变更角色",
  DELETE_DICE_ROLL: "删除掷骰",
  DELETE_CHARACTER: "删除角色",
  DELETE_POST: "删除战报",
  DELETE_BOT_BINDING: "删除QQ绑定",
  DELETE_GROUP_BINDING: "删除群绑定",
  GENERATE_API_KEY: "生成API密钥",
  DELETE_API_KEY: "删除API密钥",
  TOGGLE_API_KEY: "切换API密钥",
  CREATE_CAMPAIGN: "创建战役",
  CREATE_CHARACTER: "创建角色",
  CREATE_POST: "创建战报",
  DICE_ROLL: "掷骰",
  BIND_QQ: "绑定QQ",
  UNBIND_QQ: "解绑QQ",
  DELETE_USER: "删除用户",
  UPDATE_CAMPAIGN: "编辑战役",
  TOGGLE_POST: "切换发布",
  UPDATE_CHARACTER_STATUS: "修改角色状态",
};

export async function AuditLogTab({
  page,
  action: actionFilter,
  q,
}: {
  page: number;
  action?: string;
  q?: string;
}) {
  const where: any = {};
  if (actionFilter && actionFilter in ACTION_LABELS) {
    where.action = actionFilter;
  }
  if (q) {
    where.target = { contains: q };
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        admin: { select: { name: true, email: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // 获取所有出现过的操作类型用于筛选
  const actionTypes = await prisma.auditLog.groupBy({
    by: ["action"],
    _count: true,
    orderBy: { _count: { action: "desc" } },
  });

  const buildUrl = (params: Record<string, string>) => {
    const sp = new URLSearchParams();
    sp.set("tab", "audit");
    Object.entries(params).forEach(([k, v]) => { if (v) sp.set(k, v); });
    return `?${sp.toString()}`;
  };

  return (
    <div>
      {/* 筛选栏 */}
      <form method="get" className="mb-4 flex flex-wrap gap-2 items-center">
        <input type="hidden" name="tab" value="audit" />
        <input
          name="q"
          defaultValue={q || ""}
          placeholder="搜索目标..."
          className="flex h-9 w-48 rounded-lg border border-input bg-background px-3 text-sm"
        />
        <select
          name="action"
          defaultValue={actionFilter || ""}
          className="flex h-9 rounded-lg border border-input bg-background px-2 text-sm"
        >
          <option value="">全部操作</option>
          {actionTypes.map((a) => (
            <option key={a.action} value={a.action}>
              {ACTION_LABELS[a.action] || a.action} ({a._count})
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" size="sm">筛选</Button>
        {(q || actionFilter) && (
          <a href="?tab=audit" className="text-xs text-muted-foreground hover:text-primary">清除</a>
        )}
      </form>

      {/* 表格 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-2 pr-4 font-medium">时间</th>
              <th className="py-2 pr-4 font-medium">管理员</th>
              <th className="py-2 pr-4 font-medium">操作</th>
              <th className="py-2 pr-4 font-medium hidden md:table-cell">目标</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b last:border-0 hover:bg-muted/50">
                <td className="py-2 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString("zh-CN")}
                </td>
                <td className="py-2 pr-4 text-xs">
                  {log.admin.name || log.admin.email}
                </td>
                <td className="py-2 pr-4">
                  <Badge variant="outline" className="text-xs">
                    {ACTION_LABELS[log.action] || log.action}
                  </Badge>
                </td>
                <td className="py-2 pr-4 hidden md:table-cell text-xs text-muted-foreground max-w-xs truncate">
                  {log.target}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">暂无匹配的操作日志</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-muted-foreground">共 {total} 条，第 {page}/{totalPages} 页</span>
          <div className="flex gap-2">
            {page > 1 && (
              <a href={buildUrl({ page: String(page - 1), action: actionFilter || "", q: q || "" })} className="text-primary hover:underline">上一页</a>
            )}
            {page < totalPages && (
              <a href={buildUrl({ page: String(page + 1), action: actionFilter || "", q: q || "" })} className="text-primary hover:underline">下一页</a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
