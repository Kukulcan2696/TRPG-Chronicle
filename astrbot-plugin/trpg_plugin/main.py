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
        """掷骰并保存到平台。
用法: !r <公式> [dc<难度>] [原因/场景]
示例: !r d20 dc15 侦查检定
      !r 2d6+3 战斗"""
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

        # 解析 scene 中的 DC 和原因
        import re
        dc = None
        reason = scene.strip() if scene else None
        if scene:
            dc_match = re.match(r'^dc\s*(\d+)\s*(.*)', scene, re.IGNORECASE)
            if dc_match:
                dc = int(dc_match.group(1))
                reason = dc_match.group(2).strip() or None

        try:
            result = await self.api.roll_dice(
                formula, campaign_id, user_id,
                scene=(reason if not dc else None),  # 无 DC 时 reason=场景名
                reason=reason,
                difficulty_class=dc,
                roll_type="CHECK" if dc else "GENERAL",
            )

            # 构建回复
            outcome = result.get("outcome")
            character_name = result.get("character", {}).get("name") if result.get("character") else None

            reply_parts = []
            if reason:
                reply_parts.append(f"🎲 {reason}")
            if character_name:
                reply_parts.append(f" | {character_name}")
            if reply_parts:
                reply_parts.append("\n")

            reply_parts.append(f"{result['formula']} = {result['result']}")

            if dc is not None and outcome:
                outcome_labels = {
                    "CRITICAL_SUCCESS": "🌟 大成功!",
                    "SUCCESS": "✅ 成功",
                    "FAILURE": "❌ 失败",
                    "CRITICAL_FAILURE": "💀 大失败!",
                }
                label = outcome_labels.get(outcome, outcome)
                reply_parts.append(f" (DC{dc} → {label})")

            if result.get("details"):
                reply_parts.append(f"\n📊 {result['details']}")

            yield event.plain_result("".join(reply_parts))
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
        """查询角色。用法: !c [角色名]，无参数列出所有角色（★ 标记你绑定的角色）"""
        group_id = event.get_group_id()
        sender_id = event.get_sender_id()
        campaign_id = await self.binding.get_campaign_for_group(group_id)
        if not campaign_id:
            yield event.plain_result("⚠ 当前群未绑定战役。")
            return

        try:
            # 传入 platformId 以获取绑定信息
            result = await self.api.get_characters(
                campaign_id, name=name or None, platform_id=sender_id
            )
            chars = result.get("characters", [])
            bound_char_id = result.get("boundCharacterId")

            if not chars:
                yield event.plain_result("📭 未找到角色")
                return
            if name and len(chars) == 1:
                # 单个详情
                c = chars[0]
                reply = f"🎭 {c['name']}"
                if c.get("system"):
                    reply += f" [{c['system']}]"
                status = c.get("status", "")
                if status and status != "APPROVED":
                    status_labels = {"DRAFT": "📝草稿", "COMPLETE": "✅完成"}
                    reply += f" {status_labels.get(status, status)}"
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
                    # 标记绑定的角色
                    is_bound = "★ " if bound_char_id and c["id"] == bound_char_id else "  • "
                    lines.append(
                        f"{is_bound}{c['name']} {system_str}({player_name})"
                    )
                yield event.plain_result("\n".join(lines))
        except Exception as e:
            logger.error(f"[TRPG] 查角色失败: {e}")
            yield event.plain_result(f"❌ 查询失败: {e}")

    @filter.command("mychar")
    async def cmd_mychar(self, event: AstrMessageEvent):
        """查看我在当前战役中绑定的角色"""
        group_id = event.get_group_id()
        sender_id = event.get_sender_id()
        campaign_id = await self.binding.get_campaign_for_group(group_id)
        if not campaign_id:
            yield event.plain_result("⚠ 当前群未绑定战役。")
            return

        try:
            result = await self.api.get_characters(
                campaign_id, platform_id=sender_id
            )
            chars = result.get("characters", [])
            bound_char_id = result.get("boundCharacterId")

            if not chars or not bound_char_id:
                yield event.plain_result(
                    "📭 你还没有绑定角色。\n"
                    "请在 Web 平台的角色编辑页设置 QQ 号，或使用 !bindqq <邮箱> 先绑定账号。"
                )
                return

            my_char = next((c for c in chars if c["id"] == bound_char_id), None)
            if not my_char:
                yield event.plain_result("📭 未找到你的角色")
                return

            c = my_char
            reply = f"🎭 ★ 你的角色: {c['name']}"
            if c.get("system"):
                reply += f" [{c['system']}]"
            status = c.get("status", "")
            if status:
                status_labels = {"DRAFT": "📝草稿", "COMPLETE": "✅完成", "APPROVED": "🌟已批准"}
                reply += f" {status_labels.get(status, status)}"
            if c.get("bio"):
                reply += f"\n📝 {c['bio'][:150]}"
            yield event.plain_result(reply)
        except Exception as e:
            logger.error(f"[TRPG] 我的角色查询失败: {e}")
            yield event.plain_result(f"❌ 查询失败: {e}")

    @filter.command("createchar")
    async def cmd_createchar(self, event: AstrMessageEvent, message: str = ""):
        """创建角色并自动绑定 QQ。
用法: !createchar <名称> [系统] [key=value ...]
示例: !createchar 艾琳 DND5E STR=15 DEX=12"""
        group_id = event.get_group_id()
        sender_id = event.get_sender_id()
        campaign_id = await self.binding.get_campaign_for_group(group_id)
        if not campaign_id:
            yield event.plain_result("⚠ 当前群未绑定战役。")
            return

        if not message:
            yield event.plain_result(
                "用法: !createchar <名称> [系统] [key=value ...]\n"
                "示例: !createchar 艾琳 CUSTOM\n"
                "      !createchar 甘道夫 DND5E STR=15 DEX=12 race=人类"
            )
            return

        parts = message.strip().split()
        name = parts[0]
        system = "CUSTOM"
        sheet_data: dict = {}
        idx = 1

        # 第二个参数可能是系统名
        known_systems = ["DND5E", "COC7", "CUSTOM"]
        if len(parts) > 1 and parts[1].upper() in known_systems:
            system = parts[1].upper()
            idx = 2

        # 后续参数为 key=value
        for part in parts[idx:]:
            if "=" in part:
                k, v = part.split("=", 1)
                sheet_data[k.strip()] = v.strip()

        try:
            result = await self.api.create_character(
                name=name,
                campaign_id=campaign_id,
                player_id=sender_id,  # QQ 号 → 服务端解析
                system=system,
                sheet_data=sheet_data if sheet_data else None,
                platform_id=sender_id,  # 自动绑定 QQ
            )
            reply = f"✅ 角色「{result['name']}」已创建 [{system}]"
            if sheet_data:
                reply += f"\n📝 属性: {', '.join(f'{k}={v}' for k, v in sheet_data.items())}"
            yield event.plain_result(reply)
        except Exception as e:
            logger.error(f"[TRPG] 创建角色失败: {e}")
            # 用户未绑定的情况给提示
            err_str = str(e)
            if "未绑定" in err_str or "不存在" in err_str:
                yield event.plain_result(
                    f"❌ 创建失败：请先用 !bindqq <邮箱> 绑定平台账号。\n"
                    f"然后在 Web 平台登录后可创建角色。"
                )
            else:
                yield event.plain_result(f"❌ 创建失败: {e}")

    @filter.command("bindchar")
    async def cmd_bindchar(self, event: AstrMessageEvent, name: str = ""):
        """将当前 QQ 绑定到指定角色。用法: !bindchar <角色名>"""
        group_id = event.get_group_id()
        sender_id = event.get_sender_id()
        campaign_id = await self.binding.get_campaign_for_group(group_id)
        if not campaign_id:
            yield event.plain_result("⚠ 当前群未绑定战役。")
            return

        if not name:
            yield event.plain_result("用法: !bindchar <角色名>")

        try:
            # 先根据名字查找角色
            result = await self.api.get_characters(campaign_id, name=name)
            chars = result.get("characters", [])
            if not chars:
                yield event.plain_result(f"❌ 未找到角色: {name}")
                return

            matched = chars[0]  # 取第一个匹配的
            bind_result = await self.api.bind_character(matched["id"], sender_id)
            yield event.plain_result(
                f"✅ QQ {sender_id} 已绑定到角色「{matched['name']}」"
            )
        except Exception as e:
            logger.error(f"[TRPG] 绑定角色失败: {e}")
            yield event.plain_result(f"❌ 绑定失败: {e}")

    @filter.command("editchar")
    async def cmd_editchar(self, event: AstrMessageEvent, message: str = ""):
        """编辑自己的角色。用法: !editchar key=value [key=value ...]
示例: !editchar bio=新简介 STR=16"""
        group_id = event.get_group_id()
        sender_id = event.get_sender_id()
        campaign_id = await self.binding.get_campaign_for_group(group_id)
        if not campaign_id:
            yield event.plain_result("⚠ 当前群未绑定战役。")
            return

        if not message:
            yield event.plain_result(
                "用法: !editchar <字段>=<值> ...\n"
                "示例: !editchar bio=新简介\n"
                "      !editchar STR=16 DEX=14 status=COMPLETE"
            )
            return

        # 查找绑定的角色
        char_result = await self.api.get_characters(campaign_id, platform_id=sender_id)
        chars = char_result.get("characters", [])
        bound_id = char_result.get("boundCharacterId")
        if not bound_id or not chars:
            yield event.plain_result("❌ 你没有绑定的角色。请先用 !bindchar <角色名> 绑定。")
            return

        my_char = next((c for c in chars if c["id"] == bound_id), None)
        if not my_char:
            yield event.plain_result("❌ 未找到你的角色。")

        # 解析 key=value 对
        sheet_data: dict = {}
        bio = None
        status = None
        for part in message.strip().split():
            if "=" in part:
                k, v = part.split("=", 1)
                k, v = k.strip(), v.strip()
                if k in ("bio", "status"):
                    if k == "bio":
                        bio = v
                    elif k == "status":
                        status = v.upper()
                else:
                    sheet_data[k] = v

        try:
            await self.api.update_character(
                bound_id,
                bio=bio,
                status=status,
                sheet_data=sheet_data if sheet_data else None,
            )
            reply = f"✅ 角色「{my_char['name']}」已更新"
            if sheet_data:
                reply += f"\n📝 {', '.join(f'{k}={v}' for k, v in sheet_data.items())}"
            if bio:
                reply += f"\n📝 简介已更新"
            if status:
                status_labels = {"DRAFT": "📝草稿", "COMPLETE": "✅完成", "APPROVED": "🌟已批准"}
                reply += f"\n📊 状态: {status_labels.get(status, status)}"
            yield event.plain_result(reply)
        except Exception as e:
            logger.error(f"[TRPG] 编辑角色失败: {e}")
            yield event.plain_result(f"❌ 编辑失败: {e}")

    @filter.command("deletechar")
    async def cmd_deletechar(self, event: AstrMessageEvent, confirm: str = ""):
        """删除自己绑定的角色。用法: !deletechar confirm"""
        group_id = event.get_group_id()
        sender_id = event.get_sender_id()
        campaign_id = await self.binding.get_campaign_for_group(group_id)
        if not campaign_id:
            yield event.plain_result("⚠ 当前群未绑定战役。")
            return

        # 查找绑定的角色
        char_result = await self.api.get_characters(campaign_id, platform_id=sender_id)
        chars = char_result.get("characters", [])
        bound_id = char_result.get("boundCharacterId")
        if not bound_id or not chars:
            yield event.plain_result("❌ 你没有绑定的角色。")
            return

        my_char = next((c for c in chars if c["id"] == bound_id), None)
        if not my_char:
            yield event.plain_result("❌ 未找到你的角色。")

        if confirm.lower() != "confirm":
            yield event.plain_result(
                f"⚠ 确认删除角色「{my_char['name']}」？\n"
                f"此操作不可撤销！输入 !deletechar confirm 确认。"
            )
            return

        try:
            await self.api.delete_character(bound_id)
            self.binding.invalidate_user_cache(sender_id)
            yield event.plain_result(f"✅ 角色「{my_char['name']}」已删除。")
        except Exception as e:
            logger.error(f"[TRPG] 删除角色失败: {e}")
            yield event.plain_result(f"❌ 删除失败: {e}")

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

        # 权限检查：仅群管理员可绑定
        try:
            if not await self._check_admin(event):
                yield event.plain_result("⚠ 仅群管理员可以绑定战役。")
                return
        except Exception:
            pass  # 如果权限 API 不可用，允许继续

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
        """解绑 QQ 群。用法: !unbind（仅群管理员可用）"""
        group_id = event.get_group_id()
        if not group_id:
            yield event.plain_result("⚠ 请在 QQ 群中使用此命令。")
            return

        # 权限检查：仅群管理员可解绑
        try:
            if not await self._check_admin(event):
                yield event.plain_result("⚠ 仅群管理员可以解绑战役。")
                return
        except Exception:
            pass  # 如果权限 API 不可用，允许继续

        try:
            await self.api.unbind_group(group_id)
            self.binding.invalidate_cache(group_id)
            yield event.plain_result("✅ 本群已解绑战役。")
        except Exception as e:
            logger.error(f"[TRPG] 解绑失败: {e}")
            yield event.plain_result(f"❌ 解绑失败: {e}")

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
        sender_id = event.get_sender_id()
        group_id = event.get_group_id()

        campaign_id = await self.binding.get_campaign_for_group(group_id)
        if not campaign_id:
            yield event.plain_result("⚠ 当前群未绑定战役。")
            return

        # 标准化 status
        status_map = {
            "going": "GOING", "maybe": "MAYBE", "cant": "CANT",
            "go": "GOING", "可能": "MAYBE", "不去": "CANT", "去": "GOING",
        }
        api_status = status_map.get(status.lower(), status.upper())
        if api_status not in ("GOING", "MAYBE", "CANT"):
            yield event.plain_result(
                "⚠ 状态无效。请使用: going/maybe/cant\n"
                "示例: !rsvp abc123 going"
            )
            return

        try:
            result = await self.api.rsvp(event_id, sender_id, api_status)
            status_labels = {"GOING": "✅ 参加", "MAYBE": "🤔 可能", "CANT": "❌ 不参加"}
            yield event.plain_result(
                f"已回复: {status_labels.get(api_status, api_status)}"
            )
        except Exception as e:
            logger.error(f"[TRPG] RSVP 失败: {e}")
            yield event.plain_result(f"❌ 回复失败: {e}")

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
  !r <公式> [dc<难度>] [原因]  掷骰 (如 !r d20, !r d20 dc15 侦查)
  !rh [数量]                  查看掷骰历史

**查询**
  !c [角色名]    查角色列表/详情（★ 标记你的角色）
  !mychar        查看我绑定的角色
  !w [关键词]    搜索百科条目
  !camp          查看战役概览
  !s             查看近期排期
  !t [表名]      列随机表/掷表

**记录**
  !note 标题|内容      快速记录战报
  !timeline 事件|日期  添加时间线事件

**管理**
  !bind <slug>       绑定QQ群到战役（群管理员）
  !unbind            解绑QQ群（群管理员）
  !bindqq <邮箱>     绑定QQ号到平台账号
  !rsvp <事件ID> [going/maybe/cant]  回复排期

**角色**
  !createchar <名> [系统] [key=value..]  创建角色并绑定QQ
  !bindchar <角色名>                     绑定QQ到已有角色
  !editchar key=value ...                编辑绑定的角色
  !deletechar confirm                    删除绑定的角色

  !trpghelp          显示此帮助

📖 网站: 查看完整数据请登录平台"""
        yield event.plain_result(help_text)

    # ================================================================
    #  工具方法
    # ================================================================

    async def _check_admin(self, event: AstrMessageEvent) -> bool:
        """检查发送者是否为群管理员"""
        try:
            # AstrBot 的权限系统
            if hasattr(event, "is_admin"):
                return event.is_admin()
            # 备选：检查 role 属性
            if hasattr(event, "get_sender_role"):
                role = event.get_sender_role()
                return role in ("admin", "owner")
        except Exception:
            pass
        return True  # 如果无法判断，默认允许（避免阻止合法操作）

    # ================================================================
    #  生命周期
    # ================================================================

    async def terminate(self):
        """插件卸载时关闭 HTTP 客户端"""
        await self.api.close()
        logger.info("[TRPG] 插件已卸载")
