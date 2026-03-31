// Vunachain_landing/lib/markdown.ts
// Portable Text to Markdown Converter
// Converts Sanity's Portable Text format to clean Markdown for LLM ingestion

interface PortableTextBlock {
  _type: string;
  style?: string;
  children?: Array<{ _type: string; text: string; marks?: string[] }>;
  level?: number;
  listItem?: string;
  _key?: string;
  asset?: {
    url: string;
  };
  alt?: string;
  caption?: string;
  language?: string;
  code?: string;
}

export function portableTextToMarkdown(blocks: PortableTextBlock[]): string {
  if (!blocks) return '';

  return blocks
    .map((block) => {
      if (block._type === 'block') {
        const text = block.children
          ?.map((child) => {
            let text = child.text;

            // Apply text decorations
            if (child.marks) {
              if (child.marks.includes('strong')) text = `**${text}**`;
              if (child.marks.includes('em')) text = `_${text}_`;
              if (child.marks.includes('code')) text = `\`${text}\``;
            }

            return text;
          })
          .join('');

        // Handle block styles
        switch (block.style) {
          case 'h2':
            return `## ${text}`;
          case 'h3':
            return `### ${text}`;
          case 'h4':
            return `#### ${text}`;
          case 'blockquote':
            return `> ${text}`;
          case 'normal':
          default:
            return text;
        }
      }

      if (block._type === 'image') {
        return `![${block.alt || 'Image'}](${block.asset?.url || ''})\n\n${
          block.caption ? `_${block.caption}_\n` : ''
        }`;
      }

      if (block._type === 'code') {
        return `\`\`\`${block.language || 'javascript'}\n${block.code}\n\`\`\``;
      }

      return '';
    })
    .join('\n\n');
}

// Markdown to HTML (for frontend display)
export function markdownToHtml(markdown: string): string {
  // This is a simplified example. For production, use a library like `marked` or `remark`
  return markdown
    .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
    .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/gm, '<strong>$1</strong>')
    .replace(/_(.*?)_/gm, '<em>$1</em>')
    .replace(/`(.*?)`/gm, '<code>$1</code>')
    .replace(/\n/gm, '<br/>');
}
