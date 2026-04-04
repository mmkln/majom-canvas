import type { AppTheme } from '../../../app-runtime/index.ts';
import { ElementStatus } from '../elements/ElementStatus.ts';

export type CanvasNodeStatusPalette = {
  fill: string;
  border: string;
  text: string;
};

export type CanvasNodePalette = {
  status: Record<ElementStatus, CanvasNodeStatusPalette>;
};

export type CanvasThemePalette = {
  nodes: {
    task: CanvasNodePalette;
    story: CanvasNodePalette;
    goal: CanvasNodePalette;
  };
  interaction: {
    selection: string;
    focus: string;
    highlight: string;
    storyFocusFill: string;
    storyHighlightFill: string;
    hoverOverlayFill: string;
    hoverOutline: string;
    regionSelectionBorder: string;
    regionSelectionFill: string;
    taskDropPlaceholderFill: string;
    tempConnectionLine: string;
  };
  anchors: {
    fill: string;
    border: string;
    hoverFill: string;
  };
  handles: {
    resize: string;
    resizeHover: string;
  };
  guides: {
    smartGuide: string;
    spacing: string;
    container: string;
    viewportCenter: string;
    label: string;
  };
};

const lightPalette: CanvasThemePalette = {
  nodes: {
    story: {
      status: {
        done: { fill: 'rgba(82,196,26,0.03)', border: '#73d13d', text: '#000000' },
        'in-progress': { fill: 'rgba(24,144,255,0.03)', border: '#1890ff', text: '#000000' },
        pending: { fill: 'rgba(255,215,0,0.03)', border: '#D1D100', text: '#000000' },
        defined: { fill: 'rgba(156,163,175,0.04)', border: '#BEAEBE', text: '#000000' },
      },
    },
    task: {
      status: {
        done: { fill: '#ffffff', border: '#52c41a', text: '#000000' },
        'in-progress': { fill: '#ffffff', border: '#1890ff', text: '#000000' },
        pending: { fill: '#ffffff', border: '#D1D100', text: '#000000' },
        defined: { fill: '#ffffff', border: '#BEAEBE', text: '#000000' },
      },
    },
    goal: {
      status: {
        done: { fill: '#36B37E', border: '#0F8A63', text: '#f8fafc' },
        'in-progress': { fill: '#5A9FF2', border: '#2F7EEA', text: '#f8fafc' },
        pending: { fill: '#F4D58D', border: '#D8A441', text: '#0f172a' },
        defined: { fill: '#DDE7F0', border: '#8FA3B8', text: '#0f172a' },
      },
    },
  },
  interaction: {
    selection: '#1d4ed8',
    focus: '#8b5cf6',
    highlight: '#fa8c16',
    storyFocusFill: '#f1ecff',
    storyHighlightFill: '#fff7ed',
    hoverOverlayFill: 'rgba(29,78,216,0.1)',
    hoverOutline: 'rgba(29,78,216,0.4)',
    regionSelectionBorder: '#1d4ed8',
    regionSelectionFill: 'rgba(29,78,216,0.2)',
    taskDropPlaceholderFill: 'rgba(29,78,216,0.16)',
    tempConnectionLine: '#000000',
  },
  anchors: {
    fill: '#ffffff',
    border: '#000000',
    hoverFill: '#1d4ed8',
  },
  handles: {
    resize: '#1d4ed8',
    resizeHover: '#00A8FF',
  },
  guides: {
    smartGuide: 'rgba(29,78,216,0.72)',
    spacing: 'rgba(13, 148, 136, 0.84)',
    container: 'rgba(245, 158, 11, 0.88)',
    viewportCenter: 'rgba(14, 165, 233, 0.84)',
    label: '#0f172a',
  },
};

const darkPalette: CanvasThemePalette = {
  ...lightPalette,
  nodes: {
    story: {
      status: {
        done: { fill: 'rgba(82,196,26,0.12)', border: '#84cc16', text: '#f8fafc' },
        'in-progress': { fill: 'rgba(24,144,255,0.12)', border: '#38bdf8', text: '#f8fafc' },
        pending: { fill: 'rgba(255,215,0,0.13)', border: '#facc15', text: '#f8fafc' },
        defined: { fill: 'rgba(148,163,184,0.16)', border: '#94a3b8', text: '#f8fafc' },
      },
    },
    task: {
      status: {
        done: { fill: '#1f2937', border: '#84cc16', text: '#f8fafc' },
        'in-progress': { fill: '#1f2937', border: '#38bdf8', text: '#f8fafc' },
        pending: { fill: '#1f2937', border: '#facc15', text: '#f8fafc' },
        defined: { fill: '#1f2937', border: '#94a3b8', text: '#f8fafc' },
      },
    },
    goal: {
      status: {
        done: { fill: '#0f766e', border: '#2dd4bf', text: '#f8fafc' },
        'in-progress': { fill: '#1d4ed8', border: '#60a5fa', text: '#f8fafc' },
        pending: { fill: '#b45309', border: '#f59e0b', text: '#f8fafc' },
        defined: { fill: '#334155', border: '#94a3b8', text: '#f8fafc' },
      },
    },
  },
  interaction: {
    ...lightPalette.interaction,
    selection: '#60a5fa',
    focus: '#a78bfa',
    highlight: '#fb923c',
    storyFocusFill: '#312e81',
    storyHighlightFill: '#7c2d12',
    hoverOverlayFill: 'rgba(96,165,250,0.18)',
    hoverOutline: 'rgba(96,165,250,0.52)',
    regionSelectionBorder: '#60a5fa',
    regionSelectionFill: 'rgba(96,165,250,0.22)',
    taskDropPlaceholderFill: 'rgba(96,165,250,0.22)',
    tempConnectionLine: '#e2e8f0',
  },
  anchors: {
    fill: '#0f172a',
    border: '#e2e8f0',
    hoverFill: '#60a5fa',
  },
  handles: {
    resize: '#60a5fa',
    resizeHover: '#93c5fd',
  },
  guides: {
    smartGuide: 'rgba(96,165,250,0.86)',
    spacing: 'rgba(45, 212, 191, 0.86)',
    container: 'rgba(251, 191, 36, 0.9)',
    viewportCenter: 'rgba(56, 189, 248, 0.88)',
    label: '#f8fafc',
  },
};

export const DEFAULT_CANVAS_THEME = lightPalette;

export function resolveCanvasTheme(theme: AppTheme): CanvasThemePalette {
  return theme === 'dark' ? darkPalette : lightPalette;
}
