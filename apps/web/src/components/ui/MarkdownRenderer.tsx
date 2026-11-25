import React, { useMemo } from 'react';
import { marked } from 'marked';
import katex from 'katex';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Parses Markdown and renders LaTeX math formulas using KaTeX.
 * Safe against Markdown parsers breaking math syntax (subscripts, superscripts, etc.).
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
}) => {
  const renderedHtml = useMemo(() => {
    if (!content) return '';

    const mathStore: Array<{ id: string; math: string; display: boolean }> = [];

    // 1. Extract Display Math ($$...$$)
    let processed = content.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
      const id = `__KATEX_DISPLAY_${mathStore.length}__`;
      mathStore.push({ id, math: math.trim(), display: true });
      return `\n\n${id}\n\n`;
    });

    // 2. Extract Inline Math ($...$)
    // Negative lookbehind ensures escaped \$ is ignored; non-dollar content inside
    processed = processed.replace(/(?<!\\)\$([^\$\n]+?)\$/g, (_, math) => {
      const id = `__KATEX_INLINE_${mathStore.length}__`;
      mathStore.push({ id, math: math.trim(), display: false });
      return id;
    });

    // 3. Parse Markdown with GFM and line breaks enabled
    let html = marked.parse(processed, {
      breaks: true,
      gfm: true,
    }) as string;

    // 4. Restore and Render KaTeX into HTML
    for (const item of mathStore) {
      try {
        const rendered = katex.renderToString(item.math, {
          displayMode: item.display,
          throwOnError: false,
        });
        // marked may wrap placeholder in <p>...</p>, replace the placeholder cleanly
        html = html.replace(item.id, rendered);
      } catch {
        html = html.replace(
          item.id,
          item.display ? `$$${item.math}$$` : `$${item.math}$`
        );
      }
    }

    return html;
  }, [content]);

  return (
    <div
      className={`markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};
