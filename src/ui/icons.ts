export type IconName = 'edit' | 'copy' | 'add-related' | 'align' | 'delete';

export type IconOptions = {
  size?: number;
  strokeWidth?: number;
};

const SVG_NS = 'http://www.w3.org/2000/svg';

export function createIcon(
  name: IconName,
  options: IconOptions = {}
): SVGSVGElement {
  const size = options.size ?? 16;
  const strokeWidth = options.strokeWidth ?? 2;
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', size.toString());
  svg.setAttribute('height', size.toString());
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', strokeWidth.toString());
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');

  if (name === 'edit') {
    svg.appendChild(
      makePath('M3 17.25V21h3.75L17.8 9.95l-3.75-3.75L3 17.25z')
    );
    svg.appendChild(
      makePath(
        'M20.7 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z'
      )
    );
    return svg;
  }

  if (name === 'copy') {
    svg.appendChild(makeRect(9, 9, 11, 11, 2));
    svg.appendChild(makeRect(4, 4, 11, 11, 2));
    return svg;
  }

  if (name === 'add-related') {
    svg.appendChild(makePath('M12 5v14'));
    svg.appendChild(makePath('M5 12h14'));
    return svg;
  }

  if (name === 'align') {
    svg.appendChild(
      makePath(
        'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z'
      )
    );
    return svg;
  }

  svg.appendChild(makePath('M3 6h18'));
  svg.appendChild(makePath('M8 6V4h8v2'));
  svg.appendChild(makeRect(6, 6, 12, 14, 2));
  return svg;
}

function makePath(d: string): SVGPathElement {
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', d);
  return path;
}

function makeRect(
  x: number,
  y: number,
  width: number,
  height: number,
  rx: number
): SVGRectElement {
  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('x', x.toString());
  rect.setAttribute('y', y.toString());
  rect.setAttribute('width', width.toString());
  rect.setAttribute('height', height.toString());
  rect.setAttribute('rx', rx.toString());
  return rect;
}
