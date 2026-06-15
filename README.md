# TRPG Chronicle — 跑团编年史

专为 TRPG（桌面角色扮演游戏）玩家打造的博客平台。记录战报、管理角色、构建世界观——一切尽在一处。

## 技术栈

| 层面 | 技术 | 说明 |
|------|------|------|
| 框架 | Next.js 16 (App Router) | React 全栈框架，服务端渲染 + 客户端交互 |
| 语言 | TypeScript | 带类型的 JavaScript |
| 样式 | Tailwind CSS v4 + shadcn/ui | 原子化 CSS + 预置组件库（Base UI） |
| 数据库 | Prisma v6 + SQLite | ORM + 单文件数据库，零配置 |
| 认证 | NextAuth.js v5 | OAuth + 邮箱密码登录，JWT 策略 |
| 编辑器 | react-markdown + 自定义语法 | Markdown 渲染 + TRPG 专用语法 |

## 快速开始

```bash
# 安装依赖
npm install

# 初始化数据库
npx prisma generate
npx prisma db push

# 启动开发服务器
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

```bash
# 生产构建
npm run build
npm start
```

## 功能模块

### 认证系统
- 邮箱注册/登录（密码 bcrypt 哈希存储）
- GitHub / Google OAuth 登录
- JWT Session + 路由守卫中间件
- 角色：DM（主持人）/ PLAYER（玩家）

### 战役管理
- 创建/编辑/删除战役
- 战役封面图上传
- 仪表盘卡片视图 + 统计概览
- DM 生成邀请链接，玩家一键加入
- 8 项子导航：概览/战报/角色/百科/时间线/骰子/排期/随机表

### 战报系统
- Markdown 撰写，`react-markdown` 渲染
- 自定义跑团语法：
  - `::dice[2d6+3]` → 骰子徽章
  - `::char[角色名]` → 角色链接
  - `::wiki[类型:条目]` → 百科链接
  - `::handout[描述](url)` → 图片嵌入
  - `::secret 内容` → 仅 DM 可见段落
- 场次编号 + 游戏日期
- 编辑/删除（仅作者）

### 角色卡
- 多系统模板（D&D 5e / CoC 7th / 自定义）
- JSON 格式存储，动态表单渲染
- 角色头像上传
- 创建/查看/编辑/删除
- 属性值自动展示

### 世界观 Wiki
- 条目类型：地点 / NPC / 势力 / 物品 / 传说
- Markdown 内容 + 自定义语法渲染
- 创建/查看/编辑/删除
- 支持层级关系（子条目）

### 时间线
- 战报自动聚合（按游戏日期）
- DM 手动添加自定义事件
- 编辑/删除事件
- 可视化时间轴

### 骰子面板
- 交互式掷骰：`d20`、`2d6+3` 等公式
- 快捷骰子按钮（d4/d6/d8/d10/d12/d20/d100）
- 掷骰历史记录（持久化到数据库）
- 跨会话历史查看

### 跑团排期
- 创建场次（标题、时间、地点、备注）
- 全员 RSVP（参加 / 待定 / 缺席）
- 成员回复状态汇总
- DM 删除场次

### 随机表
- 创建掷表（遭遇表、战利品表等）
- 格式：`范围 | 结果`
- 点击"掷"按钮随机选结果（动画效果）
- 展开查看完整条目表
- 编辑/删除（仅创建者）

### 图片上传
- 支持 JPEG/PNG/GIF/WebP，最大 5MB
- 角色头像上传/更换
- 战役封面图上传
- 个人头像上传

### 个人设置
- 编辑用户名
- 上传/更换头像
- 修改密码（需验证当前密码）

## 项目结构

```
src/
├── app/                        → 页面路由（Next.js 文件即路由）
│   ├── layout.tsx              → 根布局
│   ├── page.tsx                → 首页/落地页
│   ├── (auth)/                 → 认证页面组
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (main)/                 → 主应用页面组
│   │   ├── layout.tsx          → 导航栏 + 内容区
│   │   ├── dashboard/          → 仪表盘
│   │   ├── profile/            → 个人设置
│   │   └── campaigns/          → 战役相关
│   │       ├── new/            → 创建战役
│   │       └── [slug]/         → 动态路由
│   │           ├── page.tsx    → 概览页
│   │           ├── edit/       → 编辑战役
│   │           ├── invite/     → 邀请功能
│   │           ├── posts/      → 战报
│   │           ├── characters/ → 角色
│   │           ├── wiki/       → 百科
│   │           ├── timeline/   → 时间线
│   │           ├── dice/       → 骰子
│   │           ├── schedule/   → 排期
│   │           └── tables/     → 随机表
│   ├── join/                   → 加入战役页
│   └── api/                    → API 路由
│       ├── auth/[...nextauth]/ → NextAuth 鉴权端点
│       ├── register/           → 注册 API
│       └── upload/             → 图片上传 API
├── components/                 → 可复用 UI 组件
│   ├── ui/                     → shadcn/ui 基础组件
│   ├── layout/                 → 布局组件（导航栏、面包屑、弹窗容器）
│   ├── media/                  → 图片上传组件
│   ├── post/                   → 战报组件
│   ├── character/              → 角色组件
│   ├── campaign/               → 战役组件
│   ├── wiki/                   → Wiki 组件
│   ├── schedule/               → 排期组件
│   └── tables/                 → 随机表组件
├── lib/                        → 工具库
│   ├── prisma.ts               → 数据库连接（Prisma 单例）
│   ├── auth.ts                 → 登录认证配置
│   ├── markdown.tsx            → Markdown + 跑团自定义语法渲染
│   └── character-templates.ts  → 角色卡模板定义
├── middleware.ts                → 路由守卫
└── types/                      → TypeScript 类型扩展
```

## 数据库模型

15 张表，Prisma Schema 位于 `prisma/schema.prisma`：

| 表名 | 用途 |
|------|------|
| User | 用户账号（含角色：DM / PLAYER） |
| Account | OAuth 关联（NextAuth） |
| Session | 登录会话（NextAuth） |
| VerificationToken | 邮箱验证令牌（NextAuth） |
| Campaign | 战役（含邀请码） |
| CampaignMember | 战役成员关系 |
| Post | 战报 / 博客文章 |
| Character | 角色卡（sheetData 为 JSON） |
| WorldEntry | 世界观百科条目（支持层级） |
| TimelineEvent | 时间线事件 |
| RandomTable | 随机掷表 |
| ScheduleEvent | 排期场次 |
| ScheduleRSVP | 排期回复记录 |
| DiceRoll | 骰子投掷记录 |
| Media | 图片/手册附件 |

## 开发指南

### 要改什么 → 去哪改

| 需求 | 文件位置 |
|------|----------|
| 加一个新页面 | `src/app/(main)/` 下新建目录 + `page.tsx` |
| 修改数据库结构 | `prisma/schema.prisma` → 运行 `npx prisma db push` |
| 加一个新 API | `src/app/api/` 下新建 `route.ts` |
| 改全局导航栏 | `src/components/layout/navbar.tsx` |
| 改页面样式 | 对应 `page.tsx` 里的 Tailwind CSS class |
| 加新的跑团自定义语法 | `src/lib/markdown.tsx` → `preprocessMarkdown()` |
| 改角色卡模板 | `src/lib/character-templates.ts` |
| 加新的 shadcn/ui 组件 | `npx shadcn@latest add [组件名]` |

### 常用命令

```bash
npm run dev           # 启动开发服务器（热更新）
npm run build         # 生产构建
npm start             # 生产运行
npx prisma studio     # 数据库可视化浏览器
npx prisma db push    # 同步 schema 到数据库
npx prisma generate   # 重新生成 Prisma Client
```

## 环境变量

复制 `.env.example` 为 `.env`（如不存在则创建），配置以下变量：

```env
DATABASE_URL="file:./prisma/dev.db"   # SQLite 数据库路径
AUTH_SECRET="your-secret-here"         # NextAuth 加密密钥
GITHUB_CLIENT_ID=""                   # GitHub OAuth（可选）
GITHUB_CLIENT_SECRET=""               # GitHub OAuth（可选）
GOOGLE_CLIENT_ID=""                   # Google OAuth（可选）
GOOGLE_CLIENT_SECRET=""               # Google OAuth（可选）
```

> ⚠️ `.env` 已被 `.gitignore` 排除，不会推送到 Git 仓库。