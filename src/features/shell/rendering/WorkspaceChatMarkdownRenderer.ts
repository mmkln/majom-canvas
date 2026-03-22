import DOMPurify from 'dompurify';
import { marked } from 'marked';

marked.setOptions({
  gfm: true,
  breaks: true,
});

export class WorkspaceChatMarkdownRenderer {
  public render(markdown: string): HTMLElement {
    const root = document.createElement('div');
    root.style.display = 'flex';
    root.style.flexDirection = 'column';
    root.style.gap = '8px';
    const rendered = marked.parse(markdown) as string;
    const sanitized = DOMPurify.sanitize(rendered, {
      USE_PROFILES: { html: true },
    });
    root.innerHTML = sanitized;
    this.applyMarkdownStyles(root);
    return root;
  }

  private applyMarkdownStyles(root: HTMLElement): void {
    root.style.whiteSpace = 'normal';
    root.style.wordBreak = 'break-word';

    root.querySelectorAll('p').forEach((element) => {
      const p = element as HTMLParagraphElement;
      p.style.margin = '0';
    });

    root.querySelectorAll('h1, h2, h3').forEach((element) => {
      const heading = element as HTMLElement;
      heading.style.margin = '0';
      heading.style.fontWeight = '700';
      heading.style.color = '#0f172a';
      heading.style.lineHeight = '1.35';
    });

    root.querySelectorAll('h1').forEach((element) => {
      (element as HTMLElement).style.fontSize = '17px';
    });
    root.querySelectorAll('h2').forEach((element) => {
      (element as HTMLElement).style.fontSize = '15px';
    });
    root.querySelectorAll('h3').forEach((element) => {
      (element as HTMLElement).style.fontSize = '13.5px';
    });

    root.querySelectorAll('ul, ol').forEach((element) => {
      const list = element as HTMLOListElement | HTMLUListElement;
      list.style.margin = '0';
      list.style.paddingLeft = '20px';
      list.style.display = 'flex';
      list.style.flexDirection = 'column';
      list.style.gap = '4px';
    });

    root.querySelectorAll('li').forEach((element) => {
      (element as HTMLLIElement).style.margin = '0';
    });

    root.querySelectorAll('pre').forEach((element) => {
      const pre = element as HTMLPreElement;
      pre.style.margin = '0';
      pre.style.padding = '10px 12px';
      pre.style.borderRadius = '12px';
      pre.style.background = '#0f172a';
      pre.style.color = '#e2e8f0';
      pre.style.overflowX = 'auto';
      pre.style.fontSize = '12px';
      pre.style.lineHeight = '1.55';
    });

    root.querySelectorAll('code').forEach((element) => {
      const code = element as HTMLElement;
      if (code.parentElement?.tagName === 'PRE') return;
      code.style.padding = '1px 5px';
      code.style.borderRadius = '6px';
      code.style.background = 'rgba(226, 232, 240, 0.8)';
      code.style.color = '#0f172a';
      code.style.fontSize = '0.92em';
      code.style.fontFamily =
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    });

    root.querySelectorAll('blockquote').forEach((element) => {
      const blockquote = element as HTMLQuoteElement;
      blockquote.style.margin = '0';
      blockquote.style.padding = '2px 0 2px 12px';
      blockquote.style.borderLeft = '3px solid rgba(148, 163, 184, 0.55)';
      blockquote.style.color = '#475569';
    });

    root.querySelectorAll('a').forEach((element) => {
      const link = element as HTMLAnchorElement;
      link.style.color = '#0f766e';
      link.style.textDecoration = 'underline';
      link.target = '_blank';
      link.rel = 'noreferrer noopener';
    });

    root.querySelectorAll('table').forEach((element) => {
      const table = element as HTMLTableElement;
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.fontSize = '12px';
    });

    root.querySelectorAll('th, td').forEach((element) => {
      const cell = element as HTMLTableCellElement;
      cell.style.border = '1px solid rgba(226, 232, 240, 0.9)';
      cell.style.padding = '6px 8px';
      cell.style.textAlign = 'left';
    });

    root.querySelectorAll('hr').forEach((element) => {
      const hr = element as HTMLHRElement;
      hr.style.width = '100%';
      hr.style.border = 'none';
      hr.style.borderTop = '1px solid rgba(226, 232, 240, 0.9)';
      hr.style.margin = '4px 0';
    });
  }
}
