# TRPG Chronicle — AstrBot 集成插件

为 [AstrBot](https://github.com/Soulter/AstrBot) 提供 [TRPG Chronicle](https://github.com/Kukulcan2696/TRPG-Chronicle) 跑团编年史平台的集成功能。

## 功能概览

```
QQ群用户 → NapCat(QQ协议) → AstrBot → [trpg_plugin] → HTTP API → Next.js → Prisma → SQLite
```

- 🎲 **掷骰并自动记录** — `!r d20` / `!r d20 dc15 侦查检定` 带 DC 对抗判定
- 🎭 **角色查询** — `!c` 列出角色（★ 标记你的角色）/ `!mychar` 查看我的角色
- 📚 **百科搜索** — `!w 永望城` 查世界设定
- 📖 **战役概览** — `!camp` 看当前战役统计
- 📅 **排期 + RSVP** — `!s` 看近期跑团安排 / `!rsvp <id> going` 报名参加
- 🎯 **随机表** — `!t 遭遇表` 掷随机遭遇
- 📝 **快速记录** — `!note` / `!timeline` 从 QQ 直接写战报
- 🔗 **绑定系统** — `!bind` / `!unbind` 群绑定 / `!bindqq` 用户绑定 / 角色 QQ 绑定

## 目录结构

```
trpg_plugin/
├── __init__.py      # 插件入口
├── main.py          # 插件主类 + 14 个命令处理器
├── api_client.py    # httpx 异步 HTTP 客户端
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
| | `!r d20 dc15` | 对抗 DC15，自动判定成功/失败 |
| | `!r d20 dc15 侦查检定` | 带检定原因的 DC 对抗 |
| | `!r 2d6+3 战斗` | 掷 2d6+3，标记场景 |
| `!rh` | `!rh` | 查看最近 20 条掷骰记录 |
| | `!rh 30` | 查看最近 30 条（上限 100） |

**DC 判定规则**（仅 d20 公式）：
- 结果为 20 → 🌟 大成功（CRITICAL_SUCCESS）
- 结果 ≥ DC → ✅ 成功（SUCCESS）
- 结果 < DC → ❌ 失败（FAILURE）
- 结果为 1 → 💀 大失败（CRITICAL_FAILURE）

掷骰结果自动关联发送者 QQ 绑定的平台用户和角色。

### 查询

| 命令 | 用法 | 说明 |
|------|------|------|
| `!c` | `!c` | 列出所有角色（★ 标记你绑定的角色） |
| | `!c 甘道夫` | 查看角色详情（含简介、玩家、状态） |
| `!mychar` | `!mychar` | 查看我在当前战役绑定的角色 |
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
| `!bind` | `!bind my-campaign` | 绑定 QQ 群到战役（仅群管理员） |
| `!unbind` | `!unbind` | 解绑 QQ 群（仅群管理员） |
| `!bindqq` | `!bindqq admin@trpg.local` | 绑定 QQ 号到平台账号（通过邮箱） |
| `!rsvp` | `!rsvp abc123 going` | 回复排期（going/maybe/cant） |
| `!trpghelp` | `!trpghelp` | 显示帮助信息 |

### 命令速查

```
🎲 掷骰
  !r <公式> [dc<难度>] [原因]   !r d20 / !r d20 dc15 侦查
  !rh [数量]                    !rh / !rh 30

🔍 查询
  !c [角色名]         !c / !c 甘道夫（★ 绑定角色）
  !mychar             查看我的角色
  !w [关键词]         !w / !w 永望城
  !camp               !camp
  !s                  !s
  !t [表名]           !t / !t 遭遇表

📝 记录
  !note 标题|内容     !note 第一回|今天的内容
  !timeline 事件|日期  !timeline 龙巢之战|2024-01-15

⚙ 管理
  !bind <slug>        !bind my-campaign（群管理员）
  !unbind             解绑群（群管理员）
  !bindqq <邮箱>      !bindqq admin@trpg.local
  !rsvp <ID> <状态>   !rsvp abc123 going
  !trpghelp           显示帮助
```

## 绑定系统

### 群绑定（GroupBinding）

`QQ 群号 → Campaign ID` 的映射，是插件的核心枢纽。

- 群管理员发送 `!bind <slug>` 建立绑定
- 群管理员发送 `!unbind` 解除绑定
- 绑定后，所有命令自动作用于对应战役
- 可在 Web 管理后台查看/管理绑定关系（管理后台 → 绑定管理）

### 用户绑定（BotBinding）

`QQ 号 → 平台用户 ID` 的映射，推荐所有用户绑定。

- **QQ 群内**：发送 `!bindqq <邮箱>` 将当前 QQ 绑定到平台账号
- **Web 平台**：个人设置页可直接绑定/解绑 QQ 号
- 未绑定时：掷骰和记录仍可使用（以 QQ 号作为标识）
- 绑定后：掷骰关联到你的平台账号，战报显示你的用户名

**绑定冲突检测**：同一 QQ 号只能绑定一个平台用户，重复绑定会提示已被占用的用户名。

### 角色 QQ 绑定

在 Web 平台的角色编辑页，可为角色绑定 QQ 号。

- 绑定后，角色详情页显示已绑定的 QQ
- **机器人自动识别**：`!r` 掷骰自动关联到该角色，结果中显示角色名
- **`!c` 查询**：你绑定的角色前显示 ★ 标记
- **`!mychar`**：一键查看自己绑定的角色详情
- 角色解绑（编辑页清空 QQ）仅清除角色关联，保留用户绑定

## 后端 API 参考

插件调用 Next.js 的 Bot REST API（`/api/bot/*`），全部使用 `Authorization: Bearer <api_key>` 鉴权。

| 端点 | 方法 | 用途 |
|------|------|------|
| `/dice/roll` | POST | 掷骰并持久化（支持 characterId/reason/dc/rollType） |
| `/dice/history` | GET | 掷骰历史（支持 platformId/characterId 筛选 + 分页） |
| `/characters` | GET/POST | 角色列表/搜索/创建（支持 platformId 查绑定角色） |
| `/characters/[id]` | GET | 角色详情（含 sheetData/status） |
| `/wiki` | GET | 百科搜索 |
| `/campaign` | GET | 战役信息 + 统计 |
| `/campaign/bind` | GET/POST/DELETE | 群绑定查询/设置/解绑 |
| `/binding` | GET/POST | 用户绑定（支持 email 查找） |
| `/schedule` | GET | 排期查询 |
| `/schedule/rsvp` | POST | RSVP 回复（going/maybe/cant） |
| `/tables` | GET | 随机表列表 |
| `/tables/roll` | POST | 掷随机表 |
| `/posts` | GET/POST | 战报列表/创建 |
| `/timeline` | GET/POST | 时间线事件列表/创建 |

## 许可证

MIT
