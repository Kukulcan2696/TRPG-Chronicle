# TRPG Chronicle — AstrBot 集成插件

为 [AstrBot](https://github.com/Soulter/AstrBot) 提供 [TRPG Chronicle](https://github.com/Kukulcan2696/TRPG-Chronicle) 跑团编年史平台的集成功能。

## 功能概览

```
QQ群用户 → NapCat(QQ协议) → AstrBot → [trpg_plugin] → HTTP API → Next.js → Prisma → SQLite
```

- 🎲 **掷骰并自动记录** — `!r d20` 掷骰结果实时保存到平台
- 🎭 **角色查询** — `!c 甘道夫` 查角色卡信息
- 📚 **百科搜索** — `!w 永望城` 查世界设定
- 📖 **战役概览** — `!camp` 看当前战役统计
- 📅 **排期查询** — `!s` 看近期跑团安排
- 🎯 **随机表** — `!t 遭遇表` 掷随机遭遇
- 📝 **快速记录** — `!note` / `!timeline` 从 QQ 直接写战报

## 目录结构

```
trpg_plugin/
├── __init__.py      # 插件入口
├── main.py          # 插件主类 + 12 个命令处理器
├── api_client.py    # httpx 异步 HTTP 客户端（14 个 API 方法）
├── binding.py       # 群绑定 + 用户绑定缓存管理
└── config.py        # 默认配置
```

## 依赖

- Python ≥ 3.10
- AstrBot（需支持 Star 插件基类）
- `httpx` — 异步 HTTP 客户端

```bash
pip install httpx
```

## 安装

1. 将 `trpg_plugin/` 目录复制到 AstrBot 的插件目录（通常为 `data/plugins/`）：

   ```bash
   cp -r trpg_plugin/ /path/to/astrbot/data/plugins/
   ```

2. 安装依赖：

   ```bash
   pip install httpx
   ```

3. 重启 AstrBot，插件将自动加载。

## 配置

编辑 `config.py` 或通过 AstrBot 的插件配置系统设置：

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `api_base_url` | Next.js Bot API 地址 | `http://localhost:3000/api/bot` |
| `api_key` | API 密钥（Bearer Token） | (空) |

> **获取 API Key**：登录 TRPG Chronicle → 管理后台 → API 密钥 → 生成新密钥，或在服务器执行：
> ```bash
> npx tsx scripts/generate-api-key.ts "astrbot"
> ```

## 命令参考

所有命令以 `!` 开头，在 QQ 群内使用。**使用前需先 `!bind <slug>` 绑定战役。**

### 掷骰

| 命令 | 用法 | 说明 |
|------|------|------|
| `!r` | `!r d20` | 掷一个 20 面骰 |
| | `!r 2d6+3 战斗·地精` | 掷 2d6+3，标记场景为"战斗·地精" |
| `!rh` | `!rh` | 查看最近 10 条掷骰记录 |
| | `!rh 20` | 查看最近 20 条（上限 50） |

### 查询

| 命令 | 用法 | 说明 |
|------|------|------|
| `!c` | `!c` | 列出所有角色 |
| | `!c 甘道夫` | 查看角色详情（含简介、玩家） |
| `!w` | `!w` | 列出所有百科条目 |
| | `!w 永望城` | 搜索百科（含内容摘要） |
| `!camp` | `!camp` | 查看战役概览（DM、成员、统计） |
| `!s` | `!s` | 查看近期排期和 RSVP 统计 |
| `!t` | `!t` | 列出所有随机表 |
| | `!t 遭遇表` | 掷指定随机表 |

### 记录

| 命令 | 用法 | 说明 |
|------|------|------|
| `!note` | `!note 第一回\|今天打败了巨龙` | 快速创建战报（标题\|内容） |
| `!timeline` | `!timeline 龙巢之战\|2024-01-15` | 添加时间线事件 |

### 管理

| 命令 | 用法 | 说明 |
|------|------|------|
| `!bind` | `!bind my-campaign` | 绑定 QQ 群到战役（需要 slug） |
| `!bindqq` | `!bindqq admin@trpg.local` | 绑定 QQ 号到平台账号（通过邮箱） |
| `!trpghelp` | `!trpghelp` | 显示帮助信息 |

### 命令速查

```
🎲 掷骰
  !r <公式> [场景]    !r d20 / !r 2d6+3 战斗
  !rh [数量]          !rh / !rh 20

🔍 查询
  !c [角色名]         !c / !c 甘道夫
  !w [关键词]         !w / !w 永望城
  !camp               !camp
  !s                  !s
  !t [表名]           !t / !t 遭遇表

📝 记录
  !note 标题|内容     !note 第一回|今天的内容
  !timeline 事件|日期  !timeline 龙巢之战|2024-01-15

⚙ 管理
  !bind <slug>        !bind my-campaign
  !bindqq <邮箱>      !bindqq admin@trpg.local
  !trpghelp           显示帮助
```

## 绑定系统

### 群绑定（GroupBinding）

`QQ 群号 → Campaign ID` 的映射，是插件的核心枢纽。

- 群内发送 `!bind <slug>` 建立绑定（使用战役的 URL slug）
- 绑定后，所有命令自动作用于对应战役
- 可在 Web 管理后台查看/修改绑定关系

### 用户绑定（BotBinding）

`QQ 号 → 平台用户 ID` 的映射，可选但推荐。

- **QQ 群内**：发送 `/bindqq <邮箱>` 将当前 QQ 绑定到平台账号
- **Web 平台**：个人设置页可直接绑定/解绑 QQ 号
- 未绑定时：掷骰和记录仍可正常使用（以 QQ 号作为标识）
- 绑定后：享受完整归因——掷骰关联到你的平台账号，战报显示你的用户名

### 角色 QQ 绑定

在 Web 平台的角色编辑页，可为角色绑定 QQ 号。

- 绑定后，角色详情页显示已绑定的 QQ
- 未来机器人可通过 QQ 号自动关联对应角色，实现"以角色身份掷骰"

## 后端 API 参考

插件调用 Next.js 的 Bot REST API（`/api/bot/*`），全部使用 `Authorization: Bearer <api_key>` 鉴权。

| 端点 | 方法 | 用途 |
|------|------|------|
| `/dice/roll` | POST | 掷骰并持久化 |
| `/dice/history` | GET | 掷骰历史 |
| `/characters` | GET | 角色列表/搜索 |
| `/characters/[id]` | GET | 角色详情（含 sheetData） |
| `/wiki` | GET | 百科搜索 |
| `/campaign` | GET | 战役信息 + 统计 |
| `/campaign/bind` | GET/POST | 群绑定 |
| `/binding` | GET/POST | 用户绑定 |
| `/schedule` | GET | 排期查询 |
| `/tables` | GET | 随机表列表 |
| `/tables/roll` | POST | 掷随机表 |
| `/posts` | POST | 创建战报 |
| `/timeline` | POST | 添加时间线事件 |

## 许可证

MIT
