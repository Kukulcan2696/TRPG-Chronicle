/**
 * 角色卡模板系统
 * 
 * 为了支持多种 TRPG 规则，角色卡数据用 JSON 存储（Prisma 的 sheetData 字段）。
 * 前端用模板定义来描述每个系统的字段结构，然后动态渲染表单。
 * 
 * 模板结构：
 * - id: 唯一标识（存到数据库的 system 字段）
 * - name/description: 展示用
 * - fields: 字段数组，支持嵌套（type: "section" 表示分组）
 * 
 * 每个字段的类型：
 * - text: 普通文本输入
 * - number: 数字输入
 * - textarea: 多行文本
 * - select: 下拉选择（需提供 options）
 * - section: 分组容器（包含子字段）
 */

export interface SheetField {
  key: string;
  label: string;
  type: "text" | "number" | "textarea" | "select" | "section";
  options?: { label: string; value: string }[];
  placeholder?: string;
  defaultValue?: string;
  fields?: SheetField[]; // section 类型的子字段
}

export interface SheetTemplate {
  id: string;
  name: string;
  description: string;
  fields: SheetField[];
}

export const CHARACTER_TEMPLATES: SheetTemplate[] = [
  // ===== D&D 5e 模板 =====
  {
    id: "DND5E",
    name: "D&D 5e",
    description: "龙与地下城第五版标准角色卡",
    fields: [
      {
        key: "section_basic", label: "基本信息", type: "section",
        fields: [
          { key: "race", label: "种族", type: "text", placeholder: "人类" },
          { key: "class", label: "职业", type: "text", placeholder: "战士" },
          { key: "level", label: "等级", type: "number", defaultValue: "1" },
          {
            key: "alignment", label: "阵营", type: "select",
            options: [
              { label: "守序善良", value: "LG" }, { label: "中立善良", value: "NG" },
              { label: "混乱善良", value: "CG" }, { label: "守序中立", value: "LN" },
              { label: "绝对中立", value: "TN" }, { label: "混乱中立", value: "CN" },
              { label: "守序邪恶", value: "LE" }, { label: "中立邪恶", value: "NE" },
              { label: "混乱邪恶", value: "CE" },
            ],
          },
        ],
      },
      {
        key: "section_stats", label: "属性值", type: "section",
        fields: [
          { key: "STR", label: "力量 (STR)", type: "number", defaultValue: "10" },
          { key: "DEX", label: "敏捷 (DEX)", type: "number", defaultValue: "10" },
          { key: "CON", label: "体质 (CON)", type: "number", defaultValue: "10" },
          { key: "INT", label: "智力 (INT)", type: "number", defaultValue: "10" },
          { key: "WIS", label: "感知 (WIS)", type: "number", defaultValue: "10" },
          { key: "CHA", label: "魅力 (CHA)", type: "number", defaultValue: "10" },
        ],
      },
      {
        key: "section_combat", label: "战斗属性", type: "section",
        fields: [
          { key: "hp", label: "生命值 (HP)", type: "number", defaultValue: "10" },
          { key: "ac", label: "护甲等级 (AC)", type: "number", defaultValue: "10" },
          { key: "speed", label: "速度", type: "text", placeholder: "30 ft" },
          { key: "initiative", label: "先攻加值", type: "number", defaultValue: "0" },
        ],
      },
      {
        key: "section_skills", label: "技能 & 装备", type: "section",
        fields: [
          { key: "skills", label: "技能", type: "textarea", placeholder: "察觉 +5\n潜行 +3\n..." },
          { key: "equipment", label: "装备", type: "textarea", placeholder: "长剑 1d8\n盾牌 +2 AC" },
          { key: "spells", label: "法术", type: "textarea", placeholder: "火焰箭\n魔法飞弹" },
        ],
      },
      { key: "background", label: "背景故事", type: "textarea", placeholder: "角色的背景与经历..." },
    ],
  },

  // ===== 克苏鲁的呼唤 7th 模板 =====
  {
    id: "COC7",
    name: "CoC 7th",
    description: "克苏鲁的呼唤第七版调查员卡",
    fields: [
      {
        key: "section_basic", label: "基本信息", type: "section",
        fields: [
          { key: "occupation", label: "职业", type: "text", placeholder: "记者" },
          { key: "age", label: "年龄", type: "number", defaultValue: "25" },
          { key: "sex", label: "性别", type: "text", placeholder: "男" },
        ],
      },
      {
        key: "section_stats", label: "属性值", type: "section",
        fields: [
          { key: "STR", label: "力量 (STR)", type: "number", defaultValue: "50" },
          { key: "CON", label: "体质 (CON)", type: "number", defaultValue: "50" },
          { key: "SIZ", label: "体型 (SIZ)", type: "number", defaultValue: "50" },
          { key: "DEX", label: "敏捷 (DEX)", type: "number", defaultValue: "50" },
          { key: "APP", label: "外貌 (APP)", type: "number", defaultValue: "50" },
          { key: "INT", label: "智力 (INT)", type: "number", defaultValue: "50" },
          { key: "POW", label: "意志 (POW)", type: "number", defaultValue: "50" },
          { key: "EDU", label: "教育 (EDU)", type: "number", defaultValue: "50" },
        ],
      },
      {
        key: "section_derived", label: "衍生属性", type: "section",
        fields: [
          { key: "hp", label: "生命值", type: "number", defaultValue: "10" },
          { key: "san", label: "理智值", type: "number", defaultValue: "50" },
          { key: "luck", label: "幸运", type: "number", defaultValue: "50" },
          { key: "mp", label: "魔法值", type: "number", defaultValue: "10" },
        ],
      },
      { key: "skills", label: "技能", type: "textarea", placeholder: "图书馆使用 50%\n侦查 60%" },
      { key: "background", label: "背景故事", type: "textarea", placeholder: "调查员的背景..." },
    ],
  },

  // ===== 自定义模板（自由格式） =====
  {
    id: "CUSTOM",
    name: "自定义",
    description: "自由格式角色卡，完全自定义",
    fields: [
      { key: "info", label: "角色信息", type: "textarea", placeholder: "用自由格式描述你的角色..." },
    ],
  },
];