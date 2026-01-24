export type IconName =
  | 'edit'
  | 'copy'
  | 'add-related'
  | 'align'
  | 'delete'
  | 'forward'
  | 'map-pin'
  | 'pencil'
  | 'star'
  | 'square-2-stack'
  | 'squares-plus'
  | 'minus'
  | 'plus'
  | 'trash'
  | 'arrow-ultum-left'
  | 'arrow-ultum-right'
  | 'status-done'
  | 'status-in-progress'
  | 'status-pending'
  | 'status-defined'
  | 'x-mark';

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
    svg.appendChild(makePath('M3 17.25V21h3.75L17.8 9.95l-3.75-3.75L3 17.25z'));
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

  if (name === 'map-pin') {
    svg.appendChild(makePath('M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'));
    svg.appendChild(
      makePath(
        'M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z'
      )
    );
    return svg;
  }

  if (name === 'forward') {
    svg.appendChild(
      makePath(
        'M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061A1.125 1.125 0 0 1 3 16.811V8.69ZM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061a1.125 1.125 0 0 1-1.683-.977V8.69Z'
      )
    );
    return svg;
  }

  if (name === 'pencil') {
    svg.appendChild(
      makePath(
        'm16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125'
      )
    );
    return svg;
  }

  if (name === 'star') {
    svg.appendChild(
      makePath(
        'M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z'
      )
    );
    return svg;
  }

  if (name === 'square-2-stack') {
    svg.appendChild(
      makePath(
        'M16.5 8.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v8.25A2.25 2.25 0 0 0 6 16.5h2.25m8.25-8.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-7.5A2.25 2.25 0 0 1 8.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 0 0-2.25 2.25v6'
      )
    );
    return svg;
  }

  if (name === 'squares-plus') {
    svg.appendChild(
      makePath(
        'M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v2.25A2.25 2.25 0 0 0 6 10.5Zm0 9.75h2.25A2.25 2.25 0 0 0 10.5 18v-2.25a2.25 2.25 0 0 0-2.25-2.25H6a2.25 2.25 0 0 0-2.25 2.25V18A2.25 2.25 0 0 0 6 20.25Zm9.75-9.75H18a2.25 2.25 0 0 0 2.25-2.25V6A2.25 2.25 0 0 0 18 3.75h-2.25A2.25 2.25 0 0 0 13.5 6v2.25a2.25 2.25 0 0 0 2.25 2.25Z'
      )
    );
    return svg;
  }

  if (name === 'minus') {
    svg.appendChild(
      makeFilledPath(
        'M4.25 12a.75.75 0 0 1 .75-.75h14a.75.75 0 0 1 0 1.5H5a.75.75 0 0 1-.75-.75Z',
        'evenodd'
      )
    );
    return svg;
  }

  if (name === 'plus') {
    svg.appendChild(
      makeFilledPath(
        'M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z',
        'evenodd'
      )
    );
    return svg;
  }

  if (name === 'trash') {
    svg.appendChild(
      makeFilledPath(
        'M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z',
        'evenodd'
      )
    );
    return svg;
  }

  if (name === 'arrow-ultum-left') {
    svg.appendChild(makePath('M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3'));
    return svg;
  }

  if (name === 'arrow-ultum-right') {
    svg.appendChild(makePath('m15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3'));
    return svg;
  }

  if (name === 'x-mark') {
    svg.appendChild(makePath('M6 18 18 6'));
    svg.appendChild(makePath('M6 6l12 12'));
    return svg;
  }

  if (name === 'status-done') {
    svg.appendChild(makePath('m4.5 12.75 6 6 9-13.5'));
    return svg;
  }

  if (name === 'status-in-progress') {
    svg.appendChild(
      makePath(
        'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99'
      )
    );
    return svg;
  }

  if (name === 'status-pending') {
    svg.appendChild(makePath('M12 4.5h8l-8 9h8'));
    svg.appendChild(makePath('M4 10.5h7.5l-7.5 9h7.5'));
    return svg;
  }

  if (name === 'status-defined') {
    svg.appendChild(
      makePath(
        'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z'
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

function makeFilledPath(
  d: string,
  fillRule?: 'evenodd' | 'nonzero'
): SVGPathElement {
  const path = makePath(d);
  path.setAttribute('fill', 'currentColor');
  path.setAttribute('stroke', 'none');
  if (fillRule) {
    path.setAttribute('fill-rule', fillRule);
    path.setAttribute('clip-rule', fillRule);
  }
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

function makeCircle(
  cx: number,
  cy: number,
  r: number,
  filled: boolean = false
): SVGCircleElement {
  const circle = document.createElementNS(SVG_NS, 'circle');
  circle.setAttribute('cx', cx.toString());
  circle.setAttribute('cy', cy.toString());
  circle.setAttribute('r', r.toString());
  if (filled) {
    circle.setAttribute('fill', 'currentColor');
    circle.setAttribute('stroke', 'none');
  }
  return circle;
}
