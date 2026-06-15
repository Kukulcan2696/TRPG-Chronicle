/**
 * 骰子页面（弹窗模式）
 * 
 * 功能：
 * - 输入骰子公式掷骰（如 d20, 2d6+3, 4d8+1）
 * - 快捷骰子按钮（d4, d6, d8, d10, d12, d20, d100）
 * - 每次掷骰自动保存到数据库（调用 Server Action）
 * - 页面加载时从数据库读取历史记录
 * - 本地也保留临时历史（未刷新时的快速回看）
 * 
 * 技术说明：
 * - 本页面是客户端组件（"use client"），因为需要 useState 处理交互
 * - 但通过导入 Server Action（saveDiceRoll / getDiceHistory）实现数据持久化
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dices, RotateCcw, History } from "lucide-react";
import { saveDiceRoll, getDiceHistory } from "./actions";

// 本地掷骰记录类型
interface RollRecord {
  formula: string;
  result: number;
  details: string | null;
}

/**
 * 解析骰子公式并模拟掷骰
 * 支持的格式：d20, 2d6, 3d8+2, 4d6-1
 * @returns 掷骰结果和详细信息
 */
function rollDice(formula: string): { result: number; details: string } {
  const match = formula.match(/^(\d+)?d(\d+)([+-]\d+)?$/i);
  if (!match) return { result: 0, details: "无效公式" };

  const count = parseInt(match[1] || "1");   // 骰子数量
  const sides = parseInt(match[2]);           // 骰子面数
  const mod = match[3] ? parseInt(match[3]) : 0; // 修正值

  // 投掷每个骰子
  const rolls: number[] = [];
  for (let i = 0; i < count; i++) {
    rolls.push(Math.floor(Math.random() * sides) + 1);
  }

  const total = rolls.reduce((a, b) => a + b, 0) + mod;

  // 构造详细信息字符串，如 "[5, 3, 1] + 2 = 11"
  let detail = `[${rolls.join(", ")}]`;
  if (mod !== 0) {
    detail += mod > 0 ? ` + ${mod}` : ` - ${Math.abs(mod)}`;
  }
  detail += ` = ${total}`;

  return { result: total, details: detail };
}

export default function DicePage() {
  // 骰子公式输入
  const [formula, setFormula] = useState("d20");
  // 本地掷骰历史（当前会话，刷新后消失）
  const [history, setHistory] = useState<RollRecord[]>([]);
  // 数据库中的历史记录（跨会话持久化）
  const [dbHistory, setDbHistory] = useState<RollRecord[]>([]);
  // 加载状态
  const [loadingHistory, setLoadingHistory] = useState(true);

  /**
   * 页面加载时从数据库获取历史掷骰记录
   */
  useEffect(() => {
    getDiceHistory().then((rolls) => {
      setDbHistory(rolls);
      setLoadingHistory(false);
    });
  }, []);

  /**
   * 处理掷骰：计算结果 → 保存到本地和数据库 → 更新 UI
   */
  const handleRoll = async () => {
    const r = rollDice(formula);

    // 1. 立即更新本地历史（瞬时反馈）
    setHistory((prev) => [{ formula, ...r }, ...prev].slice(0, 20));

    // 2. 保存到数据库（异步，不阻塞 UI）
    try {
      await saveDiceRoll(formula, r.result, r.details);
      // 刷新数据库历史
      const rolls = await getDiceHistory();
      setDbHistory(rolls);
    } catch (e) {
      // 保存失败不影响掷骰体验，静默处理
      console.error("保存掷骰失败:", e);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">骰子</h1>
        <p className="text-muted-foreground">在线掷骰，记录每一次命运的抉择</p>
      </div>

      {/* ===== 掷骰输入区 ===== */}
      <Card>
        <CardHeader>
          <CardTitle>掷骰</CardTitle>
          <CardDescription>输入公式：d20, 2d6+3, 4d8-1</CardDescription>
        </CardHeader>
        <CardContent>
          {/* 公式输入 + 掷骰按钮 */}
          <div className="flex gap-3">
            <Input
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="d20"
              className="font-mono text-lg"
              onKeyDown={(e) => e.key === "Enter" && handleRoll()}
            />
            <Button onClick={handleRoll} size="lg">
              <Dices className="mr-2 h-5 w-5" />
              掷!
            </Button>
          </div>

          {/* 快捷骰子按钮 */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {["d4", "d6", "d8", "d10", "d12", "d20", "d100"].map((d) => (
              <Badge
                key={d}
                variant="outline"
                className="cursor-pointer hover:bg-muted transition-colors"
                onClick={() => setFormula(d)}
              >
                {d}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ===== 本地历史（当前会话） ===== */}
      {history.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>本次掷骰</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setHistory([])}>
              <RotateCcw className="mr-1 h-3 w-3" />
              清空
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary" className="font-mono">{h.formula}</Badge>
                  <span className="font-bold text-lg">{h.result}</span>
                  <span className="text-xs text-muted-foreground">{h.details || ""}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== 数据库历史（跨会话持久化） ===== */}
      {!loadingHistory && dbHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-4 w-4" />
              历史记录
            </CardTitle>
            <CardDescription>最近 50 次掷骰（跨会话保存）</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dbHistory.map((h) => (
                <div key={(h as any).id || h.formula + h.result} className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary" className="font-mono">{h.formula}</Badge>
                  <span className="font-bold text-lg">{h.result}</span>
                  <span className="text-xs text-muted-foreground">{h.details || ""}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {loadingHistory && (
        <Card className="text-center py-8">
          <CardContent>
            <p className="text-muted-foreground">加载历史记录...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}