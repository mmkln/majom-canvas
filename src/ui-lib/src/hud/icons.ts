export type IconName =
  | 'edit'
  | 'add-related'
  | 'align'
  | 'map'
  | 'view-columns'
  | 'delete'
  | 'forward'
  | 'map-pin'
  | 'arrows-pointing-in'
  | 'arrows-pointing-out'
  | 'arrows-right-left'
  | 'pencil'
  | 'fire'
  | 'fire-solid'
  | 'star'
  | 'star-solid'
  | 'square-2-stack'
  | 'rectangle-stack'
  | 'squares-2x2'
  | 'squares-plus'
  | 'minus'
  | 'plus'
  | 'magnifying-glass'
  | 'chat-bubble-left'
  | 'chevron-double-down'
  | 'chevron-down'
  | 'bars-2'
  | 'chevron-up'
  | 'chevron-double-up'
  | 'chevron-left'
  | 'chevron-right'
  | 'ellipsis-vertical'
  | 'x-mark'
  | 'eye'
  | 'eye-slash'
  | 'link'
  | 'link-slash'
  | 'check'
  | 'check-circle'
  | 'exclamation-circle'
  | 'trash'
  | 'arrow-path'
  | 'arrow-down'
  | 'arrow-ultum-left'
  | 'arrow-ultum-right'
  | 'light-bulb'
  | 'shield-exclamation'
  | 'bolt'
  | 'slash'
  | 'puzzle-piece'
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
  svg.setAttribute('data-icon', name);
  svg.setAttribute('data-icon-name', name);

  if (name === 'edit') {
    svg.appendChild(makePath('M3 17.25V21h3.75L17.8 9.95l-3.75-3.75L3 17.25z'));
    svg.appendChild(
      makePath(
        'M20.7 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z'
      )
    );
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

  if (name === 'arrows-pointing-in') {
    svg.appendChild(
      makePath(
        'M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25'
      )
    );
    return svg;
  }

  if (name === 'arrows-pointing-out') {
    svg.appendChild(
      makePath(
        'M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15'
      )
    );
    return svg;
  }

  if (name === 'arrows-right-left') {
    svg.appendChild(
      makePath('M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5')
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

  if (name === 'fire') {
    svg.appendChild(
      makePath(
        'M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z'
      )
    );
    svg.appendChild(
      makePath(
        'M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z'
      )
    );
    return svg;
  }

  if (name === 'fire-solid') {
    svg.appendChild(
      makeFilledPath(
        'M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.176 7.547 7.547 0 0 1-1.705-1.715.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 0 1 1.925-3.546 3.75 3.75 0 0 1 3.255 3.718Z',
        'evenodd'
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

  if (name === 'star-solid') {
    svg.appendChild(
      makeFilledPath(
        'M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z',
        'evenodd'
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

  if (name === 'rectangle-stack') {
    svg.appendChild(
      makePath(
        'M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.878m13.5-3A2.25 2.25 0 0 1 19.5 9v.878m0 0a2.246 2.246 0 0 0-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0 1 21 12v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6c0-.98.626-1.813 1.5-2.122'
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

  if (name === 'exclamation-circle') {
    svg.appendChild(makePath('M12 9v3.75'));
    svg.appendChild(
      makePath(
        'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z'
      )
    );
    return svg;
  }

  if (name === 'chat-bubble-left') {
    svg.appendChild(
      makePath(
        'M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z'
      )
    );
    return svg;
  }

  if (name === 'chevron-down') {
    svg.appendChild(makePath('m19.5 8.25-7.5 7.5-7.5-7.5'));
    return svg;
  }

  if (name === 'chevron-double-down') {
    svg.appendChild(makePath('m4.5 5.25 7.5 7.5 7.5-7.5m-15 6 7.5 7.5 7.5-7.5'));
    return svg;
  }

  if (name === 'bars-2') {
    svg.appendChild(makePath('M3.75 9h16.5m-16.5 6.75h16.5'));
    return svg;
  }

  if (name === 'chevron-up') {
    svg.appendChild(makePath('m4.5 15.75 7.5-7.5 7.5 7.5'));
    return svg;
  }

  if (name === 'chevron-double-up') {
    svg.appendChild(makePath('m4.5 18.75 7.5-7.5 7.5 7.5'));
    svg.appendChild(makePath('m4.5 12.75 7.5-7.5 7.5 7.5'));
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

  if (name === 'link') {
    svg.appendChild(
      makePath(
        'M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244'
      )
    );
    return svg;
  }

  if (name === 'link-slash') {
    svg.appendChild(
      makePath(
        'M13.181 8.68a4.503 4.503 0 0 1 1.903 6.405m-9.768-2.782L3.56 14.06a4.5 4.5 0 0 0 6.364 6.365l3.129-3.129m5.614-5.615 1.757-1.757a4.5 4.5 0 0 0-6.364-6.365l-4.5 4.5c-.258.26-.479.541-.661.84m1.903 6.405a4.495 4.495 0 0 1-1.242-.88 4.483 4.483 0 0 1-1.062-1.683m6.587 2.345 5.907 5.907m-5.907-5.907L8.898 8.898M2.991 2.99 8.898 8.9'
      )
    );
    return svg;
  }

  if (name === 'check') {
    svg.appendChild(makePath('m4.5 12.75 6 6 9-13.5'));
    return svg;
  }

  if (name === 'check-circle') {
    svg.appendChild(
      makePath('M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z')
    );
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

  if (name === 'arrow-down') {
    svg.appendChild(makePath('M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3'));
    return svg;
  }

  if (name === 'light-bulb') {
    svg.appendChild(makePath('M12 18v-5.25'));
    svg.appendChild(makePath('M12 12.75a6.01 6.01 0 0 0 1.5-.189'));
    svg.appendChild(makePath('M12 12.75a6.01 6.01 0 0 1-1.5-.189'));
    svg.appendChild(makePath('M14.25 19.978a12.06 12.06 0 0 1-4.5 0'));
    svg.appendChild(makePath('M13.5 22.361a14.406 14.406 0 0 1-3 0'));
    svg.appendChild(
      makePath(
        'M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18'
      )
    );
    return svg;
  }

  if (name === 'shield-exclamation') {
    svg.appendChild(
      makePath(
        'M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z'
      )
    );
    return svg;
  }

  if (name === 'bolt') {
    svg.appendChild(
      makePath('m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z')
    );
    return svg;
  }

  if (name === 'slash') {
    svg.appendChild(makePath('m9 20.247 6-16.5'));
    return svg;
  }

  if (name === 'puzzle-piece') {
    svg.appendChild(
      makePath(
        'M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 0 1-.657.643 48.39 48.39 0 0 1-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 0 1-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 0 0-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 0 1-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 0 0 .657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 0 0 5.427-.63 48.05 48.05 0 0 0 .582-4.717.532.532 0 0 0-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 0 0 .658-.663 48.422 48.422 0 0 0-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 0 1-.61-.58v0Z'
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
