/**
 * 可掷骰的随机表卡片（客户端组件）
 * 
 * 功能：
 * - 点击"掷"按钮从表中随机选一项，结果用动画高亮显示
 * - 展开/收起查看完整条目表
 * - 表创建者可见编辑/删除按钮
 * 
 * tableData: JSON 字符串，格式 [{ range, result }, ...]
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteTableButton } from "@/components/tables/delete-button";
import { Dices, ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TableEntry {
  range: string;
  result: string;
}

interface RollableTableProps {
  id: string;
  title: string;
  description: string | null;
  tableData: string;
  authorName: string;
  /** 当前用户是否为该表创建者 */
  isOwner?: boolean;
  /** 战役 slug（编辑/删除需要） */
  campaignSlug?: string;
}

export function RollableTable({
  id,
  title,
  description,
  tableData,
  authorName,
  isOwner = false,
  campaignSlug = "",
}: RollableTableProps) {
  const [expanded, setExpanded] = useState(false);
  const [rolledIndex, setRolledIndex] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);

  // 解析 JSON 数据
  const entries: TableEntry[] = (() => {
    try { return JSON.parse(tableData); } catch { return []; }
  })();

  /** 从表中随机摇一个结果，用短动画模拟骰子转动 */
  function handleRoll() {
    if (entries.length === 0 || rolling) return;
    setRolling(true);
    setRolledIndex(null);

    // 快速切换显示模拟滚动效果
    let count = 0;
    const interval = setInterval(() => {
      setRolledIndex(Math.floor(Math.random() * entries.length));
      count++;
      if (count >= 12) {
        clearInterval(interval);
        setRolling(false);
        // 最终结果
        setRolledIndex(Math.floor(Math.random() * entries.length));
      }
    }, 60);
  }

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              {title}
              <Badge variant="secondary" className="text-xs">{entries.length} 项</Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {description || "无描述"} · by {authorName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* ===== 编辑按钮（仅创建者可见） ===== */}
            {isOwner && campaignSlug && (
              <>
                <Link
                  href={`/campaigns/${campaignSlug}/tables/${id}/edit`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button variant="ghost" size="sm" type="button">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <span onClick={(e) => e.stopPropagation()}>
                  <DeleteTableButton campaignSlug={campaignSlug} tableId={id} />
                </span>
              </>
            )}

            {/* 掷骰按钮 */}
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => { e.stopPropagation(); handleRoll(); }}
              disabled={rolling}
              className="gap-1"
            >
              <Dices className={cn("h-3.5 w-3.5", rolling && "animate-spin")} />
              掷
            </Button>

            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* 掷骰结果 */}
        {rolledIndex !== null && entries[rolledIndex] && (
          <div className="mt-2 p-2 rounded-lg bg-primary/10 border border-primary/20 animate-in fade-in zoom-in-95">
            <span className="text-sm text-muted-foreground">结果 → </span>
            <span className="text-sm font-bold text-primary">{entries[rolledIndex].result}</span>
            <span className="text-xs text-muted-foreground ml-2">({entries[rolledIndex].range})</span>
          </div>
        )}
      </CardHeader>

      {/* 展开的表条目 */}
      {expanded && (
        <CardContent className="pt-0">
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-1.5 text-left text-xs font-medium w-24">范围</th>
                  <th className="px-3 py-1.5 text-left text-xs font-medium">结果</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <tr
                    key={i}
                    className={cn(
                      "border-t transition-colors",
                      rolledIndex === i
                        ? "bg-primary/10 font-medium"
                        : "hover:bg-muted/30",
                    )}
                  >
                    <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground">{entry.range}</td>
                    <td className="px-3 py-1.5">{entry.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      )}
    </Card>
  );
}