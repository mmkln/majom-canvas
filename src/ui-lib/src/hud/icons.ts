export type IconName =
  | 'edit'
  | 'copy'
  | 'add-related'
  | 'align'
  | 'map'
  | 'view-columns'
  | 'delete'
  | 'forward'
  | 'map-pin'
  | 'pencil'
  | 'star'
  | 'square-2-stack'
  | 'squares-2x2'
  | 'squares-plus'
  | 'minus'
  | 'plus'
  | 'magnifying-glass'
  | 'chevron-down'
  | 'chevron-up'
  | 'chevron-left'
  | 'chevron-right'
  | 'ellipsis-vertical'
  | 'x-mark'
  | 'eye'
  | 'eye-slash'
  | 'check'
  | 'trash'
  | 'arrow-path'
  | 'arrow-ultum-left'
  | 'arrow-ultum-right'
  | 'status-pending'
  | 'status-defined';

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

  if (name === 'map') {
    svg.appendChild(
      makePath(
        'M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z'
      )
    );
    return svg;
  }

  if (name === 'view-columns') {
    svg.appendChild(
      makePath(
        'M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125Z'
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

  if (name === 'squares-2x2') {
    svg.appendChild(
      makePath(
        'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25V18Z'
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

  if (name === 'magnifying-glass') {
    svg.appendChild(
      makePath(
        'm21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z'
      )
    );
    return svg;
  }

  if (name === 'chevron-down') {
    svg.appendChild(makePath('m19.5 8.25-7.5 7.5-7.5-7.5'));
    return svg;
  }

  if (name === 'chevron-up') {
    svg.appendChild(makePath('m4.5 15.75 7.5-7.5 7.5 7.5'));
    return svg;
  }

  if (name === 'chevron-left') {
    svg.appendChild(makePath('M15.75 19.5 8.25 12l7.5-7.5'));
    return svg;
  }

  if (name === 'chevron-right') {
    svg.appendChild(makePath('m8.25 4.5 7.5 7.5-7.5 7.5'));
    return svg;
  }

  if (name === 'ellipsis-vertical') {
    svg.appendChild(
      makePath(
        'M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z'
      )
    );
    return svg;
  }

  if (name === 'trash') {
    svg.appendChild(
      makePath(
        'm14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0'
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

  if (name === 'eye') {
    svg.appendChild(
      makePath(
        'M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z'
      )
    );
    svg.appendChild(makePath('M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'));
    return svg;
  }

  if (name === 'eye-slash') {
    svg.appendChild(
      makePath(
        'M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88'
      )
    );
    return svg;
  }

  if (name === 'check') {
    svg.appendChild(makePath('m4.5 12.75 6 6 9-13.5'));
    return svg;
  }

  if (name === 'arrow-path') {
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
