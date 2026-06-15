"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dices, RotateCcw } from "lucide-react";

function rollDice(formula: string): { result: number; details: string } {
  const match = formula.match(/^(\d+)?d(\d+)([+-]\d+)?$/i);
  if (!match) return { result: 0, details: "无效公式" };
  const count = parseInt(match[1] || "1");
  const sides = parseInt(match[2]);
  const mod = match[3] ? parseInt(match[3]) : 0;
  const rolls: number[] = [];
  for (let i = 0; i < count; i++) {
    rolls.push(Math.floor(Math.random() * sides) + 1);
  }
  const total = rolls.reduce((a, b) => a + b, 0) + mod;
  return { result: total, details: `[${rolls.join(", ")}]${mod !== 0 ? (mod > 0 ? ` + ${mod}` : ` - ${Math.abs(mod)}`) : ""} = ${total}` };
}

export default function DicePage() {
  const [formula, setFormula] = useState("d20");
  const [history, setHistory] = useState<{ formula: string; result: number; details: string }[]>([]);

  const handleRoll = () => {
    const r = rollDice(formula);
    setHistory((prev) => [{ formula, ...r }, ...prev].slice(0, 20));
  };

  return (<div className="max-w-2xl mx-auto space-y-6">
    <div><h1 className="text-2xl font-bold">骰子 & 随机表</h1><p className="text-muted-foreground">在线掷骰，记录命运</p></div>
    <Card>
      <CardHeader><CardTitle>掷骰</CardTitle><CardDescription>输入公式：d20, 2d6+3, 4d6k3 (暂不支持k/q)</CardDescription></CardHeader>
      <CardContent>
        <div className="flex gap-3">
          <Input value={formula} onChange={(e) => setFormula(e.target.value)} placeholder="d20" className="font-mono text-lg" onKeyDown={(e) => e.key === "Enter" && handleRoll()} />
          <Button onClick={handleRoll} size="lg"><Dices className="mr-2 h-5 w-5" />掷!</Button>
        </div>
        <div className="flex gap-2 mt-3">
          {["d4", "d6", "d8", "d10", "d12", "d20", "d100"].map((d) => (
            <Badge key={d} variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => setFormula(d)}>{d}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
    {history.length > 0 && (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>掷骰记录</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setHistory([])}><RotateCcw className="mr-1 h-3 w-3" />清空</Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Badge variant="secondary" className="font-mono">{h.formula}</Badge>
                <span className="font-bold text-lg">{h.result}</span>
                <span className="text-xs text-muted-foreground">{h.details}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )}
  </div>);
}