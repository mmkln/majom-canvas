import type {
  InkstoneMarkdownBlock,
  InkstoneMarkdownDocument,
  InkstoneMarkdownInlineSegment,
} from './InkstoneMarkdownEngine.ts';

export type InkstoneMirrorRenderOptions = {
  placeholder?: string;
  activeBlockLineStart?: number | null;
};

export type InkstoneMirrorRenderMode = 'styled' | 'editing';

function applyLineStyles(
  line: HTMLDivElement,
  block: InkstoneMarkdownBlock,
  renderMode: InkstoneMirrorRenderMode
): void {
  if (renderMode === 'editing') {
    line.style.color = '#334155';
    line.style.background = 'rgba(248, 250, 252, 0.9)';
    return;
  }

  if (block.type === 'heading') {
    const headingLevel = block.level ?? 1;
    const headingScale =
      headingLevel === 1
        ? '1.2em'
        : headingLevel === 2
          ? '1.12em'
          : headingLevel === 3
            ? '1.05em'
            : headingLevel === 4
              ? '0.98em'
              : '0.93em';
    line.style.color = headingLevel <= 2 ? '#1e293b' : '#334155';
    line.style.fontSize = headingScale;
    line.style.fontWeight =
      headingLevel === 1 ? '700' : headingLevel === 2 ? '650' : headingLevel <= 4 ? '600' : '500';
    line.style.letterSpacing =
      headingLevel === 1 ? '-0.025em' : headingLevel === 2 ? '-0.02em' : '-0.01em';
    line.style.textDecoration = 'none';
    return;
  }

  if (block.type === 'thematic_break') {
    line.style.paddingTop = '0.4rem';
    line.style.paddingBottom = '0.4rem';
    line.style.display = 'flex';
    line.style.alignItems = 'center';
    return;
  }

  if (block.type === 'blockquote') {
    line.style.boxShadow = 'inset 2px 0 0 rgba(148, 163, 184, 0.5)';
    line.style.color = '#475569';
    return;
  }

  if (block.type === 'code_fence') {
    line.style.background = 'rgba(15, 23, 42, 0.08)';
    line.style.color = '#334155';
    line.style.borderRadius = '0.6rem';
    return;
  }

  if (block.type === 'task_list_item') {
    line.style.color = '#334155';
    return;
  }

  if (block.type === 'bullet_list_item' || block.type === 'ordered_list_item') {
    line.style.color = '#334155';
    return;
  }

  line.style.color = '#334155';
}

function appendTextSpan(host: HTMLElement, text: string): void {
  const span = document.createElement('span');
  span.textContent = text;
  host.appendChild(span);
}

function appendHiddenSyntax(host: HTMLElement, text: string): void {
  const span = document.createElement('span');
  span.textContent = text;
  span.setAttribute('aria-hidden', 'true');
  span.style.opacity = '0';
  span.style.userSelect = 'none';
  host.appendChild(span);
}

function renderInlineSegments(
  host: HTMLElement,
  segments: InkstoneMarkdownInlineSegment[] | undefined
): void {
  if (!segments || segments.length === 0) {
    return;
  }

  segments.forEach((segment) => {
    if (segment.type === 'text') {
      appendTextSpan(host, segment.text);
      return;
    }

    if (segment.type === 'strong') {
      appendHiddenSyntax(host, '**');
      const strong = document.createElement('strong');
      strong.textContent = segment.text;
      strong.style.color = '#0f172a';
      strong.style.textDecoration = 'underline';
      strong.style.textDecorationColor = 'rgba(15, 23, 42, 0.22)';
      host.appendChild(strong);
      appendHiddenSyntax(host, '**');
      return;
    }

    if (segment.type === 'emphasis') {
      appendHiddenSyntax(host, '_');
      const em = document.createElement('em');
      em.textContent = segment.text;
      em.style.color = '#334155';
      em.style.textDecoration = 'underline';
      em.style.textDecorationStyle = 'dotted';
      em.style.textDecorationColor = 'rgba(51, 65, 85, 0.35)';
      host.appendChild(em);
      appendHiddenSyntax(host, '_');
      return;
    }

    if (segment.type === 'code') {
      appendHiddenSyntax(host, '`');
      const code = document.createElement('code');
      code.textContent = segment.text;
      code.style.padding = '0.08rem 0.35rem';
      code.style.borderRadius = '0.4rem';
      code.style.background = 'rgba(226, 232, 240, 0.9)';
      host.appendChild(code);
      appendHiddenSyntax(host, '`');
      return;
    }

    appendHiddenSyntax(host, '[');
    const link = document.createElement('span');
    link.textContent = segment.label;
    link.style.color = '#2563eb';
    link.style.textDecoration = 'underline';
    link.dataset.inkstoneHref = segment.href;
    host.appendChild(link);
    appendHiddenSyntax(host, `](${segment.href})`);
  });
}

function createVisibleListMarker(block: InkstoneMarkdownBlock): HTMLElement {
  const marker = document.createElement('span');
  const trimmedMarker = (block.marker ?? '').trim();
  marker.dataset.inkstoneRole = 'list-marker';
  marker.setAttribute('aria-hidden', 'true');
  marker.style.display = 'inline-flex';
  marker.style.alignItems = 'center';
  marker.style.justifyContent = 'center';
  marker.style.opacity = '1';
  marker.style.color = 'rgba(100, 116, 139, 0.9)';
  marker.style.minWidth = block.type === 'ordered_list_item' ? '1.6rem' : '1rem';

  if (block.type === 'ordered_list_item') {
    marker.textContent = trimmedMarker;
    marker.style.fontSize = '0.82em';
    marker.style.fontWeight = '600';
    return marker;
  }

  marker.textContent = '•';
  marker.style.fontSize = '1em';
  marker.style.lineHeight = '1';
  return marker;
}

export class InkstoneMirrorRenderer {
  public render(
    host: HTMLElement,
    markdownDocument: InkstoneMarkdownDocument,
    options: InkstoneMirrorRenderOptions = {}
  ): void {
    host.replaceChildren();

    if (markdownDocument.normalized.length === 0) {
      const placeholder = document.createElement('div');
      placeholder.dataset.inkstoneRole = 'placeholder';
      placeholder.textContent = options.placeholder ?? '';
      placeholder.style.color = 'rgba(148, 163, 184, 0.9)';
      placeholder.style.fontStyle = 'italic';
      host.appendChild(placeholder);
      return;
    }

    markdownDocument.blocks.forEach((block) => {
      host.appendChild(
        this.createLineElement(block, {
          renderMode:
            options.activeBlockLineStart === block.lineStart ? 'editing' : 'styled',
        })
      );
    });
  }

  public createLineElement(
    block: InkstoneMarkdownBlock,
    options: { renderMode?: InkstoneMirrorRenderMode } = {}
  ): HTMLDivElement {
    const renderMode = options.renderMode ?? 'styled';
    const line = document.createElement('div');
    line.dataset.inkstoneRole = 'line';
    line.dataset.inkstoneBlockType = block.type;
    line.dataset.inkstoneLineStart = String(block.lineStart);
    line.dataset.inkstoneRenderMode = renderMode;
    line.style.minHeight = '1lh';
    line.style.whiteSpace = 'pre-wrap';
    line.style.wordBreak = 'break-word';
    applyLineStyles(line, block, renderMode);
    this.renderBlock(line, block, renderMode);
    return line;
  }

  private renderBlock(
    line: HTMLDivElement,
    block: InkstoneMarkdownBlock,
    renderMode: InkstoneMirrorRenderMode
  ): void {
    if (renderMode === 'editing') {
      line.textContent = block.type === 'blank' ? '\u00a0' : block.rawText || block.text;
      return;
    }

    if (block.type === 'blank') {
      line.textContent = '\u00a0';
      return;
    }

    if (block.type === 'thematic_break') {
      const divider = document.createElement('div');
      divider.dataset.inkstoneRole = 'divider';
      divider.setAttribute('aria-hidden', 'true');
      divider.style.height = '1px';
      divider.style.width = '100%';
      divider.style.backgroundColor = 'rgba(203, 213, 225, 0.6)';
      line.appendChild(divider);
      return;
    }

    if (block.type === 'heading') {
      renderInlineSegments(line, block.segments);
      return;
    }

    if (block.type === 'task_list_item') {
      const indentSpaces = (block.marker ?? '').match(/^\s*/)?.[0].length ?? 0;
      const row = document.createElement('div');
      row.style.display = 'grid';
      row.style.gridTemplateColumns = '1.4rem minmax(0, 1fr)';
      row.style.columnGap = '0.45rem';
      row.style.alignItems = 'start';
      row.style.paddingLeft = indentSpaces > 0 ? `${indentSpaces * 0.9}rem` : '0';

      const checkboxCell = document.createElement('div');
      checkboxCell.dataset.inkstoneRole = 'task-gutter';
      checkboxCell.style.height = '1lh';
      checkboxCell.style.display = 'flex';
      checkboxCell.style.alignItems = 'center';
      checkboxCell.style.justifyContent = 'center';

      const checkbox = document.createElement('button');
      checkbox.type = 'button';
      checkbox.dataset.inkstoneTaskToggle = 'true';
      checkbox.dataset.inkstoneLineStart = String(block.lineStart);
      checkbox.setAttribute(
        'aria-label',
        block.checked ? 'Mark task as incomplete' : 'Mark task as complete'
      );
      checkbox.style.pointerEvents = 'auto';
      checkbox.style.display = 'inline-flex';
      checkbox.style.alignItems = 'center';
      checkbox.style.justifyContent = 'center';
      checkbox.style.width = '1rem';
      checkbox.style.height = '1rem';
      checkbox.style.borderRadius = '0.25rem';
      checkbox.style.border = '1px solid rgba(148, 163, 184, 0.85)';
      checkbox.style.background = block.checked ? '#475569' : 'transparent';
      checkbox.style.color = '#ffffff';
      checkbox.style.fontSize = '0.72rem';
      checkbox.style.lineHeight = '1';
      checkbox.textContent = block.checked ? '✓' : '';
      checkboxCell.appendChild(checkbox);
      row.appendChild(checkboxCell);

      const text = document.createElement('span');
      if (block.checked) {
        text.style.textDecoration = 'line-through';
        text.style.opacity = '0.75';
      }
      renderInlineSegments(text, block.segments);
      row.appendChild(text);
      line.appendChild(row);
      return;
    }

    if (block.type === 'bullet_list_item' || block.type === 'ordered_list_item') {
      const indentSpaces = (block.marker ?? '').match(/^\s*/)?.[0].length ?? 0;
      const row = document.createElement('div');
      row.style.display = 'grid';
      row.style.gridTemplateColumns = '1.4rem minmax(0, 1fr)';
      row.style.columnGap = '0.45rem';
      row.style.alignItems = 'start';
      row.style.paddingLeft = indentSpaces > 0 ? `${indentSpaces * 0.9}rem` : '0';

      const markerCell = document.createElement('div');
      markerCell.dataset.inkstoneRole = 'list-gutter';
      markerCell.style.height = '1lh';
      markerCell.style.display = 'flex';
      markerCell.style.alignItems = 'center';
      markerCell.style.justifyContent = 'center';
      markerCell.appendChild(createVisibleListMarker(block));
      row.appendChild(markerCell);

      const text = document.createElement('span');
      renderInlineSegments(text, block.segments);
      row.appendChild(text);
      line.appendChild(row);
      return;
    }

    if (block.type === 'blockquote') {
      appendHiddenSyntax(line, '> ');
      renderInlineSegments(line, block.segments);
      return;
    }

    if (block.type === 'code_fence') {
      const languageBadge = document.createElement('div');
      languageBadge.textContent = block.language ? block.language : 'code';
      languageBadge.style.fontSize = '0.72em';
      languageBadge.style.textTransform = 'uppercase';
      languageBadge.style.letterSpacing = '0.08em';
      languageBadge.style.opacity = '0.55';
      languageBadge.style.marginBottom = '0.35rem';
      line.appendChild(languageBadge);

      const code = document.createElement('pre');
      code.textContent = block.text || '\u00a0';
      code.style.margin = '0';
      code.style.whiteSpace = 'pre-wrap';
      code.style.wordBreak = 'break-word';
      line.appendChild(code);
      return;
    }

    renderInlineSegments(line, block.segments);
  }
}

export function createInkstoneMirrorRenderer(): InkstoneMirrorRenderer {
  return new InkstoneMirrorRenderer();
}
