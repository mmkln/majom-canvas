import type { AlignmentGuideKind } from '../../core/alignment/types.ts';

export type AlignmentLineKindStyle = {
  stroke: string;
  strokeWidth: number;
  strokeOpacity: number;
  dash: readonly number[];
  showCaps: boolean;
  capSize?: number;
  lineCap?: 'butt' | 'round' | 'square';
};

export type AlignmentBandKindStyle = {
  fill: string;
  fillOpacity: number;
};

export type AlignmentBadgeKindStyle = {
  textColor: string;
  chrome?: 'pill' | 'text';
  fill?: string;
  border?: string;
};

export type AlignmentKindStyle = {
  line: AlignmentLineKindStyle;
  band?: AlignmentBandKindStyle;
  badge?: AlignmentBadgeKindStyle;
};

export type AlignmentPresentationTheme = {
  kinds: Record<
    'edge' | 'center' | 'spacing' | 'container' | 'viewportCenter',
    AlignmentKindStyle
  >;
  state: {
    secondaryOpacityMultiplier: number;
    lockedOpacityMultiplier: number;
    lockedStrokeWidthMultiplier: number;
  };
  badge: {
    fontSize: number;
    paddingX: number;
    paddingY: number;
    borderWidth: number;
    radius: number;
    fontWeight: number;
    shadowColor: string;
    shadowBlur: number;
    shadowOffsetY: number;
  };
  point: {
    visible: boolean;
    size: number;
  };
};

export const DEFAULT_ALIGNMENT_PRESENTATION_THEME: AlignmentPresentationTheme = {
  kinds: {
    edge: {
      line: {
        stroke: '#2563eb',
        strokeWidth: 1,
        strokeOpacity: 0.88,
        dash: [],
        showCaps: false,
        lineCap: 'round',
      },
    },
    center: {
      line: {
        stroke: '#2563eb',
        strokeWidth: 1,
        strokeOpacity: 0.68,
        dash: [],
        showCaps: false,
        lineCap: 'round',
      },
    },
    spacing: {
      line: {
        stroke: '#2563eb',
        strokeWidth: 1,
        strokeOpacity: 0.76,
        dash: [],
        showCaps: true,
        capSize: 6,
        lineCap: 'round',
      },
      badge: {
        chrome: 'text',
        textColor: 'rgba(30,58,138,0.84)',
      },
    },
    container: {
      line: {
        stroke: '#334155',
        strokeWidth: 1,
        strokeOpacity: 0.42,
        dash: [6, 4],
        showCaps: false,
        lineCap: 'round',
      },
    },
    viewportCenter: {
      line: {
        stroke: '#334155',
        strokeWidth: 1,
        strokeOpacity: 0.28,
        dash: [2, 4],
        showCaps: false,
        lineCap: 'round',
      },
    },
  },
  state: {
    secondaryOpacityMultiplier: 0.78,
    lockedOpacityMultiplier: 1.08,
    lockedStrokeWidthMultiplier: 1.12,
  },
  badge: {
    fontSize: 11,
    paddingX: 6,
    paddingY: 3,
    borderWidth: 1,
    radius: 999,
    fontWeight: 600,
    shadowColor: 'rgba(15,23,42,0.08)',
    shadowBlur: 8,
    shadowOffsetY: 1.5,
  },
  point: {
    visible: false,
    size: 4,
  },
};

export function getAlignmentKindStyle(
  theme: AlignmentPresentationTheme,
  kind: AlignmentGuideKind
): AlignmentKindStyle {
  if (kind === 'viewport-center') {
    return theme.kinds.viewportCenter;
  }
  return theme.kinds[kind];
}
