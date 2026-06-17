/**
 * 掷骰工具函数
 *
 * 从前端 dice-roller.tsx 提取，供 API 路由和前端组件共用。
 */

export interface DiceResult {
  result: number;
  details: string;
}

/**
 * 解析并执行掷骰公式
 *
 * 支持的格式（大小写不敏感）：
 *   d20      → 掷 1 个 20 面骰
 *   2d6+3    → 掷 2 个 6 面骰，结果 +3
 *   4d8-1    → 掷 4 个 8 面骰，结果 -1
 *
 * @param formula 掷骰公式字符串
 * @returns 掷骰结果和详情文本；公式无效时 result=0, details="无效公式"
 */
export function rollDice(formula: string): DiceResult {
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

  let detail = "[" + rolls.join(", ") + "]";
  if (mod !== 0) detail += mod > 0 ? " + " + mod : " - " + -mod;
  detail += " = " + total;

  return { result: total, details: detail };
}

/**
 * 校验掷骰公式是否合法
 */
export function isValidDiceFormula(formula: string): boolean {
  return /^(\d+)?d(\d+)([+-]\d+)?$/i.test(formula);
}
