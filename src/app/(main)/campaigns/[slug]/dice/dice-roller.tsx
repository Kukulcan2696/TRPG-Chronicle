/**
 * 骰子投掷器（客户端组件）
 * 
 * 功能：
 * - 掷骰交互 + 场景标记
 * - 历史记录按场景分组展示
 * - 数据按战役隔离持久化
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dices, RotateCcw, Tag } from "lucide-react";
import { saveDiceRoll, getDiceHistory } from "./actions";
import { rollDice } from "@/lib/dice";

interface RollRecord {
  id?: string;
  formula: string;
  result: number;
  details: string | null;
  scene: string | null;
  createdAt?: Date;
}

function groupByScene(rolls: RollRecord[]): Map<string, RollRecord[]> {
  const groups = new Map<string, RollRecord[]>();
  for (const r of rolls) {
    const key = r.scene || "未分类";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }
  return groups;
}

export function DiceRoller({ campaignId, campaignTitle }: { campaignId: string; campaignTitle: string }) {
  const [formula, setFormula] = useState("d20");
  const [scene, setScene] = useState("");
  const [history, setHistory] = useState<RollRecord[]>([]);
  const [dbLoaded, setDbLoaded] = useState(false);
  const [showScene, setShowScene] = useState(false);

  useEffect(() => {
    getDiceHistory(campaignId).then((rolls) => {
      setHistory(
        rolls.map((r) => ({
          id: r.id,
          formula: r.formula,
          result: r.result,
          details: r.details,
          scene: (r as any).scene || null,
          createdAt: r.createdAt,
        }))
      );
      setDbLoaded(true);
    });
  }, [campaignId]);

  const handleRoll = async () => {
    const r = rollDice(formula);
    const newRoll: RollRecord = {
      formula, result: r.result, details: r.details,
      scene: scene || null, createdAt: new Date(),
    };
    setHistory((prev) => [newRoll, ...prev]);
    try {
      await saveDiceRoll(campaignId, formula, r.result, r.details, scene || undefined);
    } catch (e) {
      console.error("保存掷骰失败:", e);
    }
  };

  const grouped = groupByScene(history);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">骰子</h1>
        <p className="text-muted-foreground">在线掷骰，记录每一次命运的抉择</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>掷骰</CardTitle>
          <CardDescription>输入公式：d20, 2d6+3, 4d8-1</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <Input value={formula} onChange={(e) => setFormula(e.target.value)}
              placeholder="d20" className="font-mono text-lg"
              onKeyDown={(e) => e.key === "Enter" && handleRoll()} />
            <Button onClick={handleRoll} size="lg">
              <Dices className="mr-2 h-5 w-5" />掷!
            </Button>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            {["d4", "d6", "d8", "d10", "d12", "d20", "d100"].map((d) => (
              <Badge key={d} variant="outline"
                className="cursor-pointer hover:bg-muted transition-colors"
                onClick={() => setFormula(d)}>{d}</Badge>
            ))}
            <Separator orientation="vertical" className="h-5" />
            {showScene ? (
              <Input value={scene} onChange={(e) => setScene(e.target.value)}
                placeholder="场景名，如：战斗·地精伏击"
                className="h-7 text-xs w-48"
                onKeyDown={(e) => e.key === "Enter" && handleRoll()} />
            ) : (
              <Badge variant="outline"
                className="cursor-pointer hover:bg-muted transition-colors gap-1"
                onClick={() => setShowScene(true)}>
                <Tag className="h-3 w-3" />加场景
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>掷骰历史 <span className="text-sm font-normal text-muted-foreground ml-2">{history.length} 次</span></CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setHistory([])}>
              <RotateCcw className="mr-1 h-3 w-3" />清空显示
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from(grouped.entries()).map(([sceneName, rolls]) => (
              <div key={sceneName}>
                {sceneName !== "未分类" && (
                  <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Tag className="h-3 w-3" />{sceneName} <span className="opacity-50">({rolls.length})</span>
                  </h4>
                )}
                <div className="space-y-1.5">
                  {rolls.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary" className="font-mono text-xs">{h.formula}</Badge>
                      <span className="font-bold text-lg">{h.result}</span>
                      <span className="text-xs text-muted-foreground">{h.details || ""}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!dbLoaded && history.length === 0 && (
        <Card className="text-center py-8">
          <CardContent><p className="text-muted-foreground">加载历史记录...</p></CardContent>
        </Card>
      )}
    </div>
  );
}