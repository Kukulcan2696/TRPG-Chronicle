/**
 * 管理后台 — 操作日志标签
 */
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";

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
  TOGGLE_API_KEY: "切换API密钥状态",
};

export async function AuditLogTab({ page }: { page: number }) {
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        admin: { select: { name: true, email: true } },
      },
    }),
    prisma.auditLog.count(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
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
                <td className="py-2 pr-4 hidden md:table-cell text-xs text-muted-foreground">
                  {log.target}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">暂无操作日志</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-muted-foreground">共 {total} 条，第 {page}/{totalPages} 页</span>
          <div className="flex gap-2">
            {page > 1 && <a href={`?tab=audit&page=${page - 1}`} className="text-primary hover:underline">上一页</a>}
            {page < totalPages && <a href={`?tab=audit&page=${page + 1}`} className="text-primary hover:underline">下一页</a>}
          </div>
        </div>
      )}
    </div>
  );
}
