"""
TRPG Chronicle 集成插件
=======================

为 AstrBot 提供 TRPG 博客平台的集成功能：
- 掷骰并自动记录到平台
- 查询角色卡、百科、排期、随机表
- 快速记录战报和时间线事件
- QQ 群绑定战役，QQ 号绑定平台账号

依赖: httpx (pip install httpx)
"""

import traceback
from astrbot.api.event import filter, AstrMessageEvent
from astrbot.api.star import Context, Star, register
from astrbot.api import logger

from .api_client import TrpgApiClient
from .binding import BindingManager
from .config import PLUGIN_CONFIG

VERSION = "0.1.0"


@register("trpg_plugin", "TRPG Chronicle", "跑团编年史集成：掷骰/查角色/百科/战报", VERSION)
class TrpgPlugin(Star):
    def __init__(self, context: Context):
        super().__init__(context)
        cfg = PLUGIN_CONFIG.copy()
        # 尝试从 AstrBot 配置中读取（如有）
        try:
            bot_cfg = context.get_config()
            if bot_cfg:
                cfg.update(bot_cfg)
        except Exception:
            pass
        logger.info(f"[TRPG] 初始化插件，API: {cfg.get('api_base_url')}")
        self.api = TrpgApiClient(
            base_url=cfg.get("api_base_url", "http://localhost:3000/api/bot"),
            api_key=cfg.get("api_key", ""),
        )
        self.binding = BindingManager(self.api)

    # ================================================================
    #  掷骰命令
    # ================================================================

    @filter.command("r")
    async def cmd_roll(self, event: AstrMessageEvent, formula: str, scene: str = ""):
        """掷骰并保存到平台。用法: !r d20 或 !r 2d6+3 战斗场景"""
        group_id = event.get_group_id()
        sender_id = event.get_sender_id()

        campaign_id = await self.binding.get_campaign_for_group(group_id)
        if not campaign_id:
            yield event.plain_result(
                "⚠ 当前群未绑定战役。请 DM 使用 !bind <slug> 绑定战役。"
            )
            return

        user_id = sender_id  # 没有绑定时用 QQ 号占位
        bound = await self.binding.get_user_id(sender_id)
        if bound:
            user_id = bound

        try:
            result = await self.api.roll_dice(formula, campaign_id, user_id, scene or None)
            reply = f"🎲 {result['formula']} = {result['result']}"
            if result.get("details"):
                reply += f"\n📊 {result['details']}"
            if result.get("scene"):
                reply += f"\n🏷 {result['scene']}"
            yield event.plain_result(reply)
        except Exception as e:
            logger.error(f"[TRPG] 掷骰失败: {e}")
            traceback.print_exc()
            yield event.plain_result(f"❌ 掷骰失败: {e}")

    @filter.command("rh")
    async def cmd_history(self, event: AstrMessageEvent, limit: int = 10):
        """查看掷骰历史。用法: !rh [数量，默认10]"""
        group_id = event.get_group_id()
        campaign_id = await self.binding.get_campaign_for_group(group_id)
        if not campaign_id:
            yield event.plain_result("⚠ 当前群未绑定战役。")
            return

        try:
            result = await self.api.get_dice_history(campaign_id, limit=min(limit, 50))
            rolls = result.get("rolls", [])
            if not rolls:
                yield event.plain_result("📭 暂无掷骰记录")
                return
            lines = [f"📜 最近 {len(rolls)} 次掷骰:"]
            for r in rolls[:15]:
                scene_str = f" [{r['scene']}]" if r.get("scene") else ""
                lines.append(
                    f"  {r['formula']} = {r['result']}{scene_str}"
                )
            if len(rolls) > 15:
                lines.append(f"  ... 共 {len(rolls)} 条")
            yield event.plain_result("\n".join(lines))
        except Exception as e:
            logger.error(f"[TRPG] 查历史失败: {e}")
            yield event.plain_result(f"❌ 查询失败: {e}")

    # ================================================================
    #  角色命令
    # ================================================================

    @filter.command("c")
    async def cmd_character(self, event: AstrMessageEvent, name: str = ""):
        """查询角色。用法: !c [角色名]，无参数列出所有角色"""
        group_id = event.get_group_id()
        campaign_id = await self.binding.get_campaign_for_group(group_id)
        if not campaign_id:
            yield event.plain_result("⚠ 当前群未绑定战役。")
            return

        try:
            result = await self.api.get_characters(campaign_id, name=name or None)
            chars = result.get("characters", [])
            if not chars:
                yield event.plain_result("📭 未找到角色")
                return
            if name and len(chars) == 1:
                # 单个详情
                c = chars[0]
                reply = f"🎭 {c['name']}"
                if c.get("system"):
                    reply += f" [{c['system']}]"
                if c.get("bio"):
                    reply += f"\n📝 {c['bio'][:200]}"
                if c.get("player", {}).get("name"):
                    reply += f"\n👤 玩家: {c['player']['name']}"
                yield event.plain_result(reply)
            else:
                lines = [f"🎭 角色列表（共 {len(chars)} 个）:"]
                for c in chars:
                    player_name = c.get("player", {}).get("name", "?")
                    system_str = f"[{c['system']}] " if c.get("system") else ""
                    lines.append(
                        f"  • {c['name']} {system_str}({player_name})"
                    )
                yield event.plain_result("\n".join(lines))
        except Exception as e:
            logger.error(f"[TRPG] 查角色失败: {e}")
            yield event.plain_result(f"❌ 查询失败: {e}")

    # ================================================================
    #  百科命令
    # ================================================================

    @filter.command("w")
    async def cmd_wiki(self, event: AstrMessageEvent, keyword: str = ""):
        """查询百科。用法: !w [关键词]，无参数列出条目"""
        group_id = event.get_group_id()
        campaign_id = await self.binding.get_campaign_for_group(group_id)
        if not campaign_id:
            yield event.plain_result("⚠ 当前群未绑定战役。")
            return

        try:
            result = await self.api.get_wiki_entries(campaign_id, query=keyword or None)
            entries = result.get("entries", [])
            if not entries:
                yield event.plain_result("📭 未找到百科条目")
                return
            lines = [f"📚 百科条目（共 {len(entries)} 个）:"]
            for e in entries[:15]:
                type_icon = {
                    "LOCATION": "📍", "NPC": "👤", "FACTION": "🏛",
                    "ITEM": "🎒", "LORE": "📖",
                }.get(e.get("type", "LORE"), "📄")
                author = e.get("author", {}).get("name", "?")
                lines.append(
                    f"  {type_icon} {e['title']} [{e.get('type', 'LORE')}] — {author}"
                )
            if keyword and entries:
                # 搜索到结果时显示第一条的摘要
                first = entries[0]
                content_preview = first.get("content", "")[:150]
                if content_preview:
                    lines.append(f"\n📝 {first['title']}: {content_preview}...")
            yield event.plain_result("\n".join(lines))
        except Exception as e:
            logger.error(f"[TRPG] 查百科失败: {e}")
            yield event.plain_result(f"❌ 查询失败: {e}")

    # ================================================================
    #  战役命令
    # ================================================================

    @filter.command("camp")
    async def cmd_campaign(self, event: AstrMessageEvent):
        """查看当前战役概览"""
        group_id = event.get_group_id()
        campaign_id = await self.binding.get_campaign_for_group(group_id)
        if not campaign_id:
            yield event.plain_result("⚠ 当前群未绑定战役。")
            return

        try:
            c = await self.api.get_campaign_info(campaign_id)
            counts = c.get("_count", {})
            dm = c.get("dm", {})
            lines = [
                f"📖 {c['title']}",
                f"🎲 DM: {dm.get('name', '?')}",
                f"👥 成员: {counts.get('members', 0)}",
                f"📝 战报: {counts.get('posts', 0)}",
                f"🎭 角色: {counts.get('characters', 0)}",
                f"📚 百科: {counts.get('worldEntries', 0)}",
                f"🎯 掷骰: {counts.get('diceRolls', 0)}",
                f"📅 排期: {counts.get('scheduleEvents', 0)}",
            ]
            if c.get("description"):
                lines.append(f"\n💬 {c['description'][:200]}")
            yield event.plain_result("\n".join(lines))
        except Exception as e:
            logger.error(f"[TRPG] 查战役失败: {e}")
            yield event.plain_result(f"❌ 查询失败: {e}")

    @filter.command("bind")
    async def cmd_bind(self, event: AstrMessageEvent, slug: str):
        """绑定 QQ 群到战役。用法: !bind <slug>（仅群管理员可用）"""
        group_id = event.get_group_id()
        if not group_id:
            yield event.plain_result("⚠ 请在 QQ 群中使用此命令。")
            return

        # TODO: 可选权限检查 — 确认发送者是群管理员
        # AstrBot 可通过 filter.permission_type 限制

        try:
            await self.api.bind_group(group_id, slug=slug)
            self.binding.invalidate_cache(group_id)
            yield event.plain_result(f"✅ 本群已绑定战役: {slug}")
        except Exception as e:
            logger.error(f"[TRPG] 绑定失败: {e}")
            yield event.plain_result(f"❌ 绑定失败: {e}。请确认 slug 正确。")

    @filter.command("bindqq")
    async def cmd_bindqq(self, event: AstrMessageEvent, email: str = ""):
        """绑定 QQ 号到平台账号。用法: /bindqq <邮箱>"""
        sender_id = event.get_sender_id()
        if not email:
            yield event.plain_result(
                "用法: /bindqq <邮箱>\n示例: /bindqq admin@trpg.local\n"
                "将当前 QQ 号绑定到对应邮箱的平台账号。"
            )
            return

        # 简单校验邮箱格式
        if "@" not in email or "." not in email:
            yield event.plain_result("⚠ 邮箱格式不正确")
            return

        try:
            await self.api.bind_user_by_email(sender_id, email)
            self.binding.invalidate_user_cache(sender_id)
            yield event.plain_result(f"✅ QQ {sender_id} 已绑定到 {email}")
        except Exception as e:
            logger.error(f"[TRPG] 用户绑定失败: {e}")
            yield event.plain_result(f"❌ 绑定失败: {e}。请确认邮箱已注册平台账号。")

    @filter.command("unbind")
    async def cmd_unbind(self, event: AstrMessageEvent):
        """解绑 QQ 群。用法: !unbind"""
        group_id = event.get_group_id()
        if not group_id:
            yield event.plain_result("⚠ 请在 QQ 群中使用此命令。")
            return
        # 解绑即设为空（实际需额外 API，这里跳过实现细节）
        yield event.plain_result("ℹ 解绑功能待实现，请通过 Web 管理后台操作。")

    # ================================================================
    #  排期命令
    # ================================================================

    @filter.command("s")
    async def cmd_schedule(self, event: AstrMessageEvent):
        """查看近期排期"""
        group_id = event.get_group_id()
        campaign_id = await self.binding.get_campaign_for_group(group_id)
        if not campaign_id:
            yield event.plain_result("⚠ 当前群未绑定战役。")
            return

        try:
            result = await self.api.get_schedule(campaign_id, upcoming=True)
            events = result.get("events", [])
            if not events:
                yield event.plain_result("📭 暂无近期排期")
                return
            lines = ["📅 近期排期:"]
            for e in events[:8]:
                time_str = e.get("scheduledAt", "")[:16].replace("T", " ")
                creator = e.get("creator", {}).get("name", "?")
                rsvps = e.get("rsvps", [])
                going = sum(1 for r in rsvps if r.get("status") == "GOING")
                maybe = sum(1 for r in rsvps if r.get("status") == "MAYBE")
                cant = sum(1 for r in rsvps if r.get("status") == "CANT")
                lines.append(
                    f"  📍 {e['title']} — {time_str} ({creator})"
                )
                lines.append(
                    f"      ✅{going} 🤔{maybe} ❌{cant}"
                )
                if e.get("location"):
                    lines.append(f"      📍 {e['location']}")
            yield event.plain_result("\n".join(lines))
        except Exception as e:
            logger.error(f"[TRPG] 查排期失败: {e}")
            yield event.plain_result(f"❌ 查询失败: {e}")

    @filter.command("rsvp")
    async def cmd_rsvp(
        self, event: AstrMessageEvent, event_id: str, status: str = "going"
    ):
        """回复排期。用法: !rsvp <事件ID> [going/maybe/cant]"""
        # RSVP 需要平台用户绑定
        yield event.plain_result("ℹ RSVP 功能请通过 Web 平台操作。")

    # ================================================================
    #  随机表命令
    # ================================================================

    @filter.command("t")
    async def cmd_table(self, event: AstrMessageEvent, name: str = ""):
        """掷随机表或列出所有表。用法: !t [表名]"""
        group_id = event.get_group_id()
        campaign_id = await self.binding.get_campaign_for_group(group_id)
        if not campaign_id:
            yield event.plain_result("⚠ 当前群未绑定战役。")
            return

        try:
            tables_result = await self.api.get_tables(campaign_id)
            tables = tables_result.get("tables", [])
            if not tables:
                yield event.plain_result("📭 暂无随机表")
                return

            if not name:
                # 列出所有表
                lines = [f"🎲 随机表（共 {len(tables)} 个）:"]
                for t in tables:
                    author = t.get("author", {}).get("name", "?")
                    desc = f" — {t['description'][:40]}" if t.get("description") else ""
                    lines.append(f"  • {t['title']}{desc} ({author})")
                yield event.plain_result("\n".join(lines))
                return

            # 按名称匹配表
            matched = None
            for t in tables:
                if name.lower() in t["title"].lower():
                    matched = t
                    break
            if not matched:
                yield event.plain_result(f"❌ 未找到表: {name}")
                return

            # 掷表
            roll_result = await self.api.roll_table(matched["id"])
            rolled = roll_result.get("rolled", {})
            reply = f"🎲 {roll_result['tableTitle']}\n"
            reply += f"📋 {rolled.get('range', '?')}: {rolled.get('result', '?')}"
            yield event.plain_result(reply)
        except Exception as e:
            logger.error(f"[TRPG] 随机表失败: {e}")
            yield event.plain_result(f"❌ 失败: {e}")

    # ================================================================
    #  记录命令
    # ================================================================

    @filter.command("note")
    async def cmd_note(self, event: AstrMessageEvent, message: str = ""):
        """快速记录战报。用法: !note 标题|内容"""
        if not message:
            yield event.plain_result("用法: !note 标题|内容")
            return

        group_id = event.get_group_id()
        sender_id = event.get_sender_id()
        campaign_id = await self.binding.get_campaign_for_group(group_id)
        if not campaign_id:
            yield event.plain_result("⚠ 当前群未绑定战役。")
            return

        parts = message.split("|", 1)
        title = parts[0].strip()
        content = parts[1].strip() if len(parts) > 1 else title

        user_id = sender_id
        bound = await self.binding.get_user_id(sender_id)
        if bound:
            user_id = bound

        try:
            result = await self.api.create_post(campaign_id, title, content, user_id)
            yield event.plain_result(f"✅ 战报已记录: {result['title']} (slug: {result['slug']})")
        except Exception as e:
            logger.error(f"[TRPG] 记录失败: {e}")
            yield event.plain_result(f"❌ 记录失败: {e}")

    @filter.command("timeline")
    async def cmd_timeline(self, event: AstrMessageEvent, message: str = ""):
        """添加时间线事件。用法: !timeline 事件名|日期(如 2024-01-15)"""
        if not message:
            yield event.plain_result("用法: !timeline 事件名|日期")
            return

        group_id = event.get_group_id()
        campaign_id = await self.binding.get_campaign_for_group(group_id)
        if not campaign_id:
            yield event.plain_result("⚠ 当前群未绑定战役。")
            return

        parts = message.split("|", 1)
        title = parts[0].strip()
        game_date = parts[1].strip() if len(parts) > 1 else ""

        try:
            result = await self.api.create_timeline_event(
                campaign_id, title, game_date
            )
            yield event.plain_result(f"✅ 时间线已添加: {result['title']} ({result['gameDate']})")
        except Exception as e:
            logger.error(f"[TRPG] 时间线添加失败: {e}")
            yield event.plain_result(f"❌ 添加失败: {e}")

    # ================================================================
    #  帮助命令
    # ================================================================

    @filter.command("trpghelp", alias={"help"})
    async def cmd_help(self, event: AstrMessageEvent):
        """显示帮助信息"""
        help_text = """🎲 TRPG Chronicle Bot 帮助

**掷骰**
  !r <公式> [场景]  掷骰并保存 (如 !r d20, !r 2d6+3 战斗)
  !rh [数量]        查看掷骰历史

**查询**
  !c [角色名]       查角色列表/详情
  !w [关键词]       搜索百科条目
  !camp             查看战役概览
  !s                查看近期排期
  !t [表名]         列随机表/掷表

**记录**
  !note 标题|内容    快速记录战报
  !timeline 事件|日期  添加时间线事件

**管理**
  !bind <slug>      绑定QQ群到战役（DM）
  !bindqq <邮箱>    绑定QQ号到平台账号
  !trpghelp         显示此帮助

📖 网站: 查看完整数据请登录平台"""
        yield event.plain_result(help_text)

    # ================================================================
    #  生命周期
    # ================================================================

    async def terminate(self):
        """插件卸载时关闭 HTTP 客户端"""
        await self.api.close()
        logger.info("[TRPG] 插件已卸载")
