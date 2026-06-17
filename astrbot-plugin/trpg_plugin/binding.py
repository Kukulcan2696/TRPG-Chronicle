"""
绑定管理器 — 管理 QQ 群 ↔ 战役、QQ 号 ↔ 平台用户的映射与缓存
"""

from typing import Dict, Optional

from .api_client import TrpgApiClient


class BindingManager:
    """缓存并管理群绑定和用户绑定关系"""

    def __init__(self, api: TrpgApiClient):
        self.api = api
        self._campaign_cache: Dict[str, str] = {}  # group_id → campaign_id
        self._user_cache: Dict[str, Optional[str]] = {}  # platform_id → user_id

    async def get_campaign_for_group(self, group_id: str) -> Optional[str]:
        """获取 QQ 群绑定的战役 ID；没有返回 None"""
        if not group_id:
            return None
        if group_id in self._campaign_cache:
            return self._campaign_cache[group_id]

        try:
            result = await self.api.get_group_binding(group_id)
            if result.get("bound"):
                campaign_id = result.get("campaignId")
                if campaign_id:
                    self._campaign_cache[group_id] = campaign_id
                return campaign_id
            self._campaign_cache[group_id] = None
            return None
        except Exception:
            return None

    async def get_user_id(self, platform_id: str) -> Optional[str]:
        """获取 QQ 号绑定的平台用户 ID"""
        if not platform_id:
            return None
        if platform_id in self._user_cache:
            return self._user_cache[platform_id]

        try:
            result = await self.api.get_user_binding(platform_id)
            if result.get("bound"):
                user_id = result.get("userId")
                self._user_cache[platform_id] = user_id
                return user_id
            self._user_cache[platform_id] = None
            return None
        except Exception:
            return None

    def invalidate_cache(self, group_id: str = None):
        """清除缓存（绑定变更后调用）"""
        if group_id:
            self._campaign_cache.pop(group_id, None)
        else:
            self._campaign_cache.clear()

    def invalidate_user_cache(self, platform_id: str = None):
        """清除用户绑定缓存"""
        if platform_id:
            self._user_cache.pop(platform_id, None)
        else:
            self._user_cache.clear()
