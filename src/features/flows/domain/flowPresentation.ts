import {
  Priority,
  type Flow,
  type FlowMeta,
} from '../../../majom-wrapper/interfaces/index.ts';

export const FLOW_THEME_COLORS = [
  'indigo',
  'violet',
  'fuchsia',
  'rose',
  'orange',
  'amber',
  'lime',
  'emerald',
  'teal',
  'cyan',
  'blue',
  'slate',
] as const;

export const FLOW_THEME_ICONS = [
  'book-open',
  'heart',
  'code-brackets',
  'command-line',
  'computer-desktop',
  'academic-cap',
  'notebook',
  'book-closed',
  'brain',
  'paw',
  'lotus',
  'plant',
  'dumbbell',
  'currency-dollar',
  'folder',
  'plane',
  'health',
  'popcorn',
  'bar-chart',
] as const;

export const FLOW_RISK_LEVELS = ['stable', 'medium', 'high'] as const;
export const FLOW_PRIORITIES = [
  Priority.Lowest,
  Priority.Low,
  Priority.Medium,
  Priority.High,
  Priority.Highest,
] as const;

export type FlowThemeColor = (typeof FLOW_THEME_COLORS)[number];
export type FlowThemeIcon = (typeof FLOW_THEME_ICONS)[number];
export type FlowRiskLevel = (typeof FLOW_RISK_LEVELS)[number];
export type FlowPriority = (typeof FLOW_PRIORITIES)[number];

export type FlowPresentationSettings = {
  icon: FlowThemeIcon | null;
  color: FlowThemeColor | null;
  timeProfile: string | null;
  riskLevel: FlowRiskLevel | null;
  priority: FlowPriority | null;
  collapsed: boolean | null;
  hidden: boolean | null;
};

const FLOW_ICON_SET = new Set<string>(FLOW_THEME_ICONS);
const FLOW_COLOR_SET = new Set<string>(FLOW_THEME_COLORS);
const FLOW_RISK_SET = new Set<string>(FLOW_RISK_LEVELS);
const FLOW_PRIORITY_SET = new Set<string>(FLOW_PRIORITIES);

export function getFallbackFlowColor(): FlowThemeColor {
  return 'slate';
}

export function getFallbackFlowIcon(): FlowThemeIcon {
  return 'folder';
}

export function readFlowPresentationSettings(
  flow: Pick<Flow, 'meta'>
): FlowPresentationSettings {
  const presentation = readRecord(readRecord(flow.meta)?.presentation);
  const icon = presentation?.icon;
  const color = presentation?.color;
  const timeProfile = presentation?.timeProfile;
  const riskLevel = presentation?.riskLevel;
  const priority = presentation?.priority;
  const collapsed = presentation?.collapsed;
  const hidden = presentation?.hidden;

  return {
    icon:
      typeof icon === 'string' && FLOW_ICON_SET.has(icon)
        ? (icon as FlowThemeIcon)
        : null,
    color:
      typeof color === 'string' && FLOW_COLOR_SET.has(color)
        ? (color as FlowThemeColor)
        : null,
    timeProfile:
      typeof timeProfile === 'string' && timeProfile.trim()
        ? timeProfile.trim()
        : null,
    riskLevel:
      typeof riskLevel === 'string' && FLOW_RISK_SET.has(riskLevel)
        ? (riskLevel as FlowRiskLevel)
        : null,
    priority:
      typeof priority === 'string' && FLOW_PRIORITY_SET.has(priority)
        ? (priority as FlowPriority)
        : null,
    collapsed: typeof collapsed === 'boolean' ? collapsed : null,
    hidden: typeof hidden === 'boolean' ? hidden : null,
  };
}

export function writeFlowPresentationSettings(
  currentMeta: FlowMeta | undefined,
  settings: FlowPresentationSettings
): FlowMeta {
  const meta = { ...(readRecord(currentMeta) ?? {}) };
  const presentation = {
    ...(readRecord(meta.presentation) ?? {}),
    icon: settings.icon,
    color: settings.color,
    timeProfile: settings.timeProfile,
    riskLevel: settings.riskLevel,
    priority: settings.priority,
    collapsed: settings.collapsed,
    hidden: settings.hidden,
  };
  meta.presentation = presentation;
  return meta;
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
