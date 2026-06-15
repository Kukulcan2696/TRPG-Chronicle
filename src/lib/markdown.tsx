/**
 * Markdown 渲染器 + 跑团自定义语法处理器
 * 
 * 工作流程：
 * 1. preprocessMarkdown() - 先把 ::dice[] ::char[] 等自定义语法
 *    替换成 HTML 标签
 * 2. ReactMarkdown - 把 Markdown 渲染成 React 组件
 * 3. rehypeRaw - 允许渲染上一步生成的原始 HTML
 * 4. remarkGfm - 支持 GitHub 风格 Markdown（表格、任务列表等）
 */

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

/**
 * 预处理 Markdown 文本，把跑团自定义语法替换为 HTML
 * 
 * 支持的自定义语法：
 * ::dice[公式]     → 骰子徽章
 * ::char[角色名]    → 角色链接
 * ::wiki[类型:条目] → 百科链接
 * ::handout[描述](url) → 手札图片
 * ::secret 内容    → 仅 DM 可见段落
 */
function preprocessMarkdown(content: string): string {
  return content
    // ::dice[2d6+3] → 带骰子图标的徽章
    .replace(
      /::dice\[([^\]]+)\]/g,
      (_: string, formula: string) =>
        `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-sm font-mono font-bold not-prose">🎲 ${formula}</span>`,
    )
    // ::char[甘道夫] → 蓝色角色链接
    .replace(
      /::char\[([^\]]+)\]/g,
      (_: string, name: string) =>
        `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-500 text-sm font-medium not-prose">👤 ${name}</span>`,
    )
    // ::wiki[地点:永望城] → 琥珀色百科链接
    .replace(
      /::wiki\[([^\]]+)\]/g,
      (_: string, ref: string) =>
        `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-sm font-medium not-prose">📖 ${ref}</span>`,
    )
    // ::handout[地图](url) → 图片嵌入
    .replace(
      /::handout\[([^\]]*)\]\(([^)]+)\)/g,
      (_: string, desc: string, url: string) =>
        `<figure class="not-prose my-4"><img src="${url}" alt="${desc}" class="rounded-lg border max-w-full" loading="lazy" /><figcaption class="text-sm text-muted-foreground mt-1 text-center">${desc || "手札"}</figcaption></figure>`,
    )
    // ::secret 内容 → 红色虚线框标记，前端可根据角色控制显示
    .replace(
      /::secret\s+([\s\S]*?)(?=\n\n|\n*$)/g,
      (_: string, secretContent: string) =>
        `<div class="secret-block border border-dashed border-destructive/30 rounded-lg p-3 my-3 bg-destructive/5 not-prose"><p class="text-xs text-destructive font-medium mb-1">🔒 仅主持人可见</p><div class="secret-content">${secretContent.trim()}</div></div>`,
    );
}

/**
 * 从 Markdown 提取纯文本摘要（用于卡片预览）
 */
export function markdownToExcerpt(content: string, maxLength = 150): string {
  const plain = content
    // 去掉自定义语法
    .replace(/::\w+\[[^\]]*\](?:\([^)]+\))?/g, "")
    .replace(/::secret[\s\S]*?(?=\n\n|\n*$)/g, "")
    // 去掉 Markdown 标记符号
    .replace(/[#*`\[\]()!_~>|\\]/g, "")
    .replace(/\n+/g, " ")
    .trim();
  return plain.length > maxLength ? plain.slice(0, maxLength) + "..." : plain;
}

/**
 * Markdown 渲染组件
 * 
 * 使用 Tailwind 的 prose 类提供排版样式，
 * 然后用自定义 CSS 覆盖部分样式以匹配暗色主题。
 */
export function MarkdownRenderer({ content }: { content: string }) {
  // 第一步：预处理自定义语法
  const processed = preprocessMarkdown(content);

  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none
      prose-headings:scroll-mt-20
      prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-4
      prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3
      prose-p:leading-7 prose-p:my-3
      prose-a:text-primary prose-a:no-underline hover:prose-a:underline
      prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 prose-blockquote:py-1 prose-blockquote:px-4
      prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
      prose-pre:bg-muted/50 prose-pre:border
      prose-img:rounded-lg prose-img:border
    ">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}  // GitHub 风格 Markdown
        rehypePlugins={[rehypeRaw]}   // 允许渲染原始 HTML
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}