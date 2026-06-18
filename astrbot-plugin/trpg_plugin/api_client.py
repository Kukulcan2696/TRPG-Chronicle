"""
HTTP API 客户端 — 封装对 Next.js Bot API 的所有调用
"""

from typing import Any, Dict, Optional, List

import httpx


class TrpgApiClient:
    """异步 HTTP 客户端，封装对 Next.js Bot REST API 的调用"""

    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.client = httpx.AsyncClient(timeout=15.0)

    async def close(self):
        await self.client.aclose()

    async def _request(
        self, method: str, path: str, **kwargs
    ) -> Dict[str, Any]:
        headers = kwargs.pop("headers", {})
        headers["Authorization"] = f"Bearer {self.api_key}"
        headers["Content-Type"] = "application/json"

        url = f"{self.base_url}{path}"
        resp = await self.client.request(method, url, headers=headers, **kwargs)
        resp.raise_for_status()
        return resp.json()

    # ── 掷骰 ──

    async def roll_dice(
        self,
        formula: str,
        campaign_id: str,
        user_id: str,
        scene: Optional[str] = None,
        character_id: Optional[str] = None,
        reason: Optional[str] = None,
        difficulty_class: Optional[int] = None,
        roll_type: str = "GENERAL",
    ) -> Dict[str, Any]:
        body: Dict[str, Any] = {
            "formula": formula,
            "campaignId": campaign_id,
            "userId": user_id,
            "rollType": roll_type,
        }
        if scene:
            body["scene"] = scene
        if character_id:
            body["characterId"] = character_id
        if reason:
            body["reason"] = reason
        if difficulty_class is not None:
            body["difficultyClass"] = difficulty_class
        return await self._request("POST", "/dice/roll", json=body)

    async def get_dice_history(
        self, campaign_id: str, user_id: Optional[str] = None, limit: int = 20
    ) -> Dict[str, Any]:
        params = {"campaignId": campaign_id, "limit": str(limit)}
        if user_id:
            params["userId"] = user_id
        return await self._request("GET", "/dice/history", params=params)

    # ── 角色 ──

    async def get_characters(
        self,
        campaign_id: str,
        name: Optional[str] = None,
        platform_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        params: Dict[str, str] = {"campaignId": campaign_id}
        if name:
            params["name"] = name
        if platform_id:
            params["platformId"] = platform_id
        return await self._request("GET", "/characters", params=params)

    async def get_character_detail(self, char_id: str) -> Dict[str, Any]:
        return await self._request("GET", f"/characters/{char_id}")

    async def create_character(
        self,
        name: str,
        campaign_id: str,
        player_id: str,
        system: str = "CUSTOM",
        bio: Optional[str] = None,
        sheet_data: Optional[Dict[str, Any]] = None,
        platform_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        body: Dict[str, Any] = {
            "name": name,
            "campaignId": campaign_id,
            "playerId": player_id,
            "system": system,
        }
        if bio:
            body["bio"] = bio
        if sheet_data:
            body["sheetData"] = sheet_data
        if platform_id:
            body["platformId"] = platform_id
        return await self._request("POST", "/characters", json=body)

    async def update_character(
        self,
        char_id: str,
        name: Optional[str] = None,
        bio: Optional[str] = None,
        status: Optional[str] = None,
        sheet_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        body: Dict[str, Any] = {}
        if name is not None:
            body["name"] = name
        if bio is not None:
            body["bio"] = bio
        if status is not None:
            body["status"] = status
        if sheet_data is not None:
            body["sheetData"] = sheet_data
        return await self._request("PATCH", f"/characters/{char_id}", json=body)

    async def delete_character(self, char_id: str) -> Dict[str, Any]:
        return await self._request("DELETE", f"/characters/{char_id}")

    async def bind_character(
        self, char_id: str, platform_id: str
    ) -> Dict[str, Any]:
        return await self._request(
            "POST", f"/characters/{char_id}/bind", json={"platformId": platform_id}
        )

    # ── 百科 ──

    async def get_wiki_entries(
        self,
        campaign_id: str,
        query: Optional[str] = None,
        entry_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        params = {"campaignId": campaign_id}
        if query:
            params["q"] = query
        if entry_type:
            params["type"] = entry_type
        return await self._request("GET", "/wiki", params=params)

    # ── 战役 ──

    async def get_campaign_info(self, campaign_id: str) -> Dict[str, Any]:
        return await self._request("GET", "/campaign", params={"campaignId": campaign_id})

    async def bind_group(
        self, group_id: str, campaign_id: str = "", slug: str = ""
    ) -> Dict[str, Any]:
        body = {"groupId": group_id}
        if campaign_id:
            body["campaignId"] = campaign_id
        elif slug:
            body["slug"] = slug
        return await self._request("POST", "/campaign/bind", json=body)

    async def get_group_binding(self, group_id: str) -> Dict[str, Any]:
        return await self._request("GET", "/campaign/bind", params={"groupId": group_id})

    async def unbind_group(self, group_id: str) -> Dict[str, Any]:
        return await self._request("DELETE", "/campaign/bind", params={"groupId": group_id})

    # ── 排期 ──

    async def get_schedule(
        self, campaign_id: str, upcoming: bool = True
    ) -> Dict[str, Any]:
        return await self._request(
            "GET",
            "/schedule",
            params={"campaignId": campaign_id, "upcoming": str(upcoming).lower()},
        )

    async def rsvp(
        self, schedule_event_id: str, user_id: str, status: str
    ) -> Dict[str, Any]:
        return await self._request(
            "POST",
            "/schedule/rsvp",
            json={
                "scheduleEventId": schedule_event_id,
                "userId": user_id,
                "status": status,
            },
        )

    # ── 随机表 ──

    async def get_tables(self, campaign_id: str) -> Dict[str, Any]:
        return await self._request("GET", "/tables", params={"campaignId": campaign_id})

    async def roll_table(self, table_id: str) -> Dict[str, Any]:
        return await self._request("POST", "/tables/roll", json={"tableId": table_id})

    # ── 记录 ──

    async def create_post(
        self,
        campaign_id: str,
        title: str,
        content: str,
        user_id: str,
        session_number: Optional[int] = None,
    ) -> Dict[str, Any]:
        body = {
            "campaignId": campaign_id,
            "title": title,
            "content": content,
            "userId": user_id,
        }
        if session_number:
            body["sessionNumber"] = session_number
        return await self._request("POST", "/posts", json=body)

    async def create_timeline_event(
        self,
        campaign_id: str,
        title: str,
        game_date: str,
        description: Optional[str] = None,
    ) -> Dict[str, Any]:
        body = {
            "campaignId": campaign_id,
            "title": title,
            "gameDate": game_date,
        }
        if description:
            body["description"] = description
        return await self._request("POST", "/timeline", json=body)

    # ── 绑定 ──

    async def get_user_binding(self, platform_id: str) -> Dict[str, Any]:
        return await self._request("GET", "/binding", params={"platformId": platform_id})

    async def bind_user(self, platform_id: str, user_id: str) -> Dict[str, Any]:
        return await self._request(
            "POST",
            "/binding",
            json={"platformId": platform_id, "userId": user_id},
        )

    async def bind_user_by_email(
        self, platform_id: str, email: str
    ) -> Dict[str, Any]:
        """通过邮箱绑定 QQ 号到平台用户"""
        return await self._request(
            "POST",
            "/binding",
            json={"platformId": platform_id, "email": email},
        )
