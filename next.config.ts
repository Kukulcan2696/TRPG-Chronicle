/**
 * Next.js 配置文件
 * 
 * bodySizeLimit: 允许更大文件上传（默认限制可能太小）
 */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 允许请求体最大 10MB，比我们的 5MB 限制更宽松
  serverExternalPackages: [],
  // 图片上传支持
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;