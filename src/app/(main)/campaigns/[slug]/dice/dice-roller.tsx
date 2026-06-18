/**
 * 骰子投掷器（客户端组件）
 *
 * 功能：
 * - 角色选择：以特定角色的身份掷骰
 * - DC 对抗：设定难度等级，自动判定成功/失败/大成功/大失败
 * - 检定原因：记录这次掷骰的目的（如"侦查检定"）
 * - 场景标记：按场景分组查看历史
 * - 历史记录：显示角色、公式、结果、DC、判定
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dices, RotateCcw, Tag, User, ScrollText, CheckCircle, XCircle, ShieldAlert, Sparkles } from "lucide-react";
import { saveDiceRoll, getDiceHistory } from "./actions";
import { rollDice } from "@/lib/dice";
import { cn } from "@/lib/utils";

interface CharacterInfo {
  id: string;
  name: string;
}

interface RollRecord {
  id?: string;
  formula: string;
  result: number;
  details: string | null;
  scene: string | null;
  characterId?: string | null;
  characterName?: string | null;
  reason?: string | null;
  difficultyClass?: number | null;
  outcome?: string | null;
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

const OUTCOME_CONFIG: Record<string, { icon: typeof CheckCircle; label: string; color: string }> = {
  CRITICAL_SUCCESS: { icon: Sparkles, label: "大成功!", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  SUCCESS: { icon: CheckCircle, label: "成功", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  FAILURE: { icon: XCircle, label: "失败", color: "text-red-400 bg-red-500/10 border-red-500/30" },
  CRITICAL_FAILURE: { icon: ShieldAlert, label: "大失败!", color: "text-red-500 bg-red-600/10 border-red-600/30" },
};

export function DiceRoller({
  campaignId,
  campaignTitle,
  characters,
}: {
  campaignId: string;
  campaignTitle: string;
  characters: CharacterInfo[];
}) {
  const [formula, setFormula] = useState("d20");
  const [scene, setScene] = useState("");
  const [characterId, setCharacterId] = useState<string>("__player__");
  const [difficultyClass, setDifficultyClass] = useState("");
  const [reason, setReason] = useState("");
  const [history, setHistory] = useState<RollRecord[]>([]);
  const [dbLoaded, setDbLoaded] = useState(false);
  const [showScene, setShowScene] = useState(false);
  const [lastRoll, setLastRoll] = useState<RollRecord | null>(null);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    getDiceHistory(campaignId).then((rolls) => {
      setHistory(
        rolls.map((r: any) => ({
          id: r.id,
          formula: r.formula,
          result: r.result,
          details: r.details,
          scene: r.scene || null,
          characterId: r.characterId || null,
          characterName: r.character?.name || null,
          reason: r.reason || null,
          difficultyClass: r.difficultyClass || null,
          outcome: r.outcome || null,
          createdAt: r.createdAt,
        }))
      );
      setDbLoaded(true);
    });
  }, [campaignId]);

  const selectedCharacter = characters.find((c) => c.id === characterId);

  const handleRoll = useCallback(async () => {
    setRolling(true);
    const r = rollDice(formula);

    const dcNum = difficultyClass ? parseInt(difficultyClass, 10) : null;
    let outcome: string | null = null;
    if (dcNum !== null && !isNaN(dcNum)) {
      if (r.result === 1) {
        outcome = "CRITICAL_FAILURE";
      } else if (formula.startsWith("d20") && r.result === 20) {
        outcome = "CRITICAL_SUCCESS";
      } else if (r.result >= dcNum) {
        outcome = "SUCCESS";
      } else {
        outcome = "FAILURE";
      }
    }

    const newRoll: RollRecord = {
      formula,
      result: r.result,
      details: r.details,
      scene: scene || null,
      characterId: characterId !== "__player__" ? characterId : null,
      characterName: characterId !== "__player__" ? selectedCharacter?.name || null : null,
      reason: reason || null,
      difficultyClass: dcNum,
      outcome,
      createdAt: new Date(),
    };

    setLastRoll(newRoll);
    setHistory((prev) => [newRoll, ...prev]);

    try {
      await saveDiceRoll(
        campaignId,
        formula,
        r.result,
        r.details,
        scene || undefined,
        characterId !== "__player__" ? characterId : undefined,
        reason || undefined,
        dcNum ?? undefined,
        outcome || undefined,
        "CHECK"
      );
    } catch (e) {
      console.error("保存掷骰失败:", e);
    }
    setRolling(false);
  }, [formula, campaignId, scene, characterId, selectedCharacter, reason, difficultyClass]);

  const grouped = groupByScene(history);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">骰子</h1>
        <p className="text-muted-foreground">在线掷骰，记录每一次命运的抉择</p>
      </div>

      {/* 掷骰面板 */}
      <Card>
        <CardHeader>
          <CardTitle>掷骰</CardTitle>
          <CardDescription>输入公式：d20, 2d6+3, 4d8-1</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 角色选择 */}
          {characters.length > 0 && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select value={characterId} onValueChange={(value) => setCharacterId(value ?? "__player__")}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__player__">👤 以玩家身份（不关联角色）</SelectItem>
                  {characters.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      🎭 {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* DC + 原因 */}
          <div className="flex gap-3">
            <div className="w-24 shrink-0">
              <Input
                value={difficultyClass}
                onChange={(e) => setDifficultyClass(e.target.value.replace(/\D/g, ""))}
                placeholder="DC"
                className="h-9 text-center font-mono"
              />
            </div>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="检定原因，如：侦查检定·寻找陷阱"
              className="h-9 flex-1"
            />
          </div>

          {/* 公式输入 */}
          <div className="flex gap-3">
            <Input
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="d20"
              className="font-mono text-lg h-11"
              onKeyDown={(e) => e.key === "Enter" && handleRoll()}
            />
            <Button onClick={handleRoll} size="lg" disabled={rolling}>
              <Dices className="mr-2 h-5 w-5" />
              掷!
            </Button>
          </div>

          {/* 快速选择 + 场景 */}
          <div className="flex gap-2 items-center flex-wrap">
            {["d4", "d6", "d8", "d10", "d12", "d20", "d100"].map((d) => (
              <Badge
                key={d}
                variant={formula === d ? "default" : "outline"}
                className="cursor-pointer hover:bg-muted transition-colors"
                onClick={() => setFormula(d)}
              >
                {d}
              </Badge>
            ))}
            <Separator orientation="vertical" className="h-5" />
            {showScene ? (
              <Input
                value={scene}
                onChange={(e) => setScene(e.target.value)}
                placeholder="场景名，如：战斗·地精伏击"
                className="h-7 text-xs w-48"
                onKeyDown={(e) => e.key === "Enter" && handleRoll()}
              />
            ) : (
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-muted transition-colors gap-1"
                onClick={() => setShowScene(true)}
              >
                <Tag className="h-3 w-3" />加场景
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 最近一次结果 */}
      {lastRoll && (
        <Card
          className={cn(
            "border-2 transition-all",
            lastRoll.outcome
              ? OUTCOME_CONFIG[lastRoll.outcome]?.color
              : "border-primary/30"
          )}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                {lastRoll.reason && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ScrollText className="h-3.5 w-3.5" />
                    {lastRoll.reason}
                  </div>
                )}
                <div className="flex items-center gap-3">
                  {lastRoll.characterName && (
                    <Badge variant="secondary" className="gap-1">
                      <User className="h-3 w-3" />
                      {lastRoll.characterName}
                    </Badge>
                  )}
                  <span className="font-mono font-bold text-2xl">
                    {lastRoll.formula} = {lastRoll.result}
                  </span>
                  {lastRoll.difficultyClass && lastRoll.outcome && (
                    <Badge className={cn("text-sm px-2 py-1", OUTCOME_CONFIG[lastRoll.outcome]?.color)}>
                      {(() => {
                        const cfg = OUTCOME_CONFIG[lastRoll.outcome];
                        const Icon = cfg?.icon;
                        return (
                          <>
                            {Icon && <Icon className="h-3.5 w-3.5 mr-1" />}
                            {cfg?.label} (DC {lastRoll.difficultyClass})
                          </>
                        );
                      })()}
                    </Badge>
                  )}
                </div>
                {lastRoll.details && (
                  <p className="text-xs text-muted-foreground">{lastRoll.details}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 历史记录 */}
      {history.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              掷骰历史
              <span className="text-sm font-normal text-muted-foreground ml-2">
                {history.length} 次
              </span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setHistory([])}>
              <RotateCcw className="mr-1 h-3 w-3" />
              清空显示
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from(grouped.entries()).map(([sceneName, rolls]) => (
              <div key={sceneName}>
                {sceneName !== "未分类" && (
                  <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {sceneName}
                    <span className="opacity-50">({rolls.length})</span>
                  </h4>
                )}
                <div className="space-y-1.5">
                  {rolls.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {h.characterName && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          🎭{h.characterName}
                        </span>
                      )}
                      {h.reason && !h.scene && (
                        <span className="text-xs text-muted-foreground truncate max-w-32">
                          {h.reason}
                        </span>
                      )}
                      <Badge variant="secondary" className="font-mono text-xs">
                        {h.formula}
                      </Badge>
                      <span className="font-bold text-lg">{h.result}</span>
                      {h.difficultyClass && (
                        <span className="text-xs text-muted-foreground">
                          DC{h.difficultyClass}
                        </span>
                      )}
                      {h.outcome && (
                        <span
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded",
                            OUTCOME_CONFIG[h.outcome]?.color
                          )}
                        >
                          {OUTCOME_CONFIG[h.outcome]?.label}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {h.details || ""}
                      </span>
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
          <CardContent>
            <p className="text-muted-foreground">加载历史记录...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
