import type { SmartGuideLine } from '../services/SmartAlignmentService.ts';

export type AlignmentAxis = 'x' | 'y';

export type AlignmentGuideKind =
  | 'edge'
  | 'center'
  | 'spacing'
  | 'container'
  | 'viewport-center';

export type AlignmentVisualEmphasis =
  | 'primary'
  | 'secondary'
  | 'structural'
  | 'measurement';

export type AlignmentVisualPlacement =
  | 'span'
  | 'centerline'
  | 'outside-top'
  | 'outside-bottom'
  | 'outside-left'
  | 'outside-right';

export type AlignmentBadgeLabelMode = 'default' | 'measurement';

export type AlignmentInteractionMode = 'move' | 'resize';

export type AlignmentSubjectRole =
  | 'element'
  | 'container'
  | 'viewport'
  | 'virtual';

export type AlignmentScopeKind = 'local' | 'container' | 'viewport' | 'global';

export type AlignmentAnchorRole =
  | 'start'
  | 'center'
  | 'end'
  | 'gap-start'
  | 'gap-end';

export type AlignmentRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
};

export type AlignmentAnchor = {
  id: string;
  axis: AlignmentAxis;
  role: AlignmentAnchorRole;
  kind: AlignmentGuideKind;
  value: number;
  secondaryStart: number;
  secondaryEnd: number;
};

export type AlignmentSubject = {
  id: string;
  role: AlignmentSubjectRole;
  scopeKind: AlignmentScopeKind;
  scopeId: string | null;
  bounds: AlignmentRect;
  anchors: AlignmentAnchor[];
  priority?: number;
};

export type AlignmentLineVisual = {
  type: 'line';
  axis: AlignmentAxis;
  kind: AlignmentGuideKind;
  emphasis: AlignmentVisualEmphasis;
  placement: AlignmentVisualPlacement;
  primary: boolean;
  locked: boolean;
  position: number;
  start: number;
  end: number;
};

export type AlignmentBandVisual = {
  type: 'band';
  axis: AlignmentAxis;
  kind: AlignmentGuideKind;
  emphasis: AlignmentVisualEmphasis;
  placement: AlignmentVisualPlacement;
  primary: boolean;
  start: number;
  end: number;
  depthStart: number;
  depthEnd: number;
};

export type AlignmentPointVisual = {
  type: 'point';
  kind: AlignmentGuideKind;
  emphasis: AlignmentVisualEmphasis;
  placement: AlignmentVisualPlacement;
  primary: boolean;
  x: number;
  y: number;
};

export type AlignmentBadgeVisual = {
  type: 'badge';
  kind: AlignmentGuideKind;
  emphasis: AlignmentVisualEmphasis;
  placement: AlignmentVisualPlacement;
  labelMode: AlignmentBadgeLabelMode;
  text: string;
  x: number;
  y: number;
};

export type AlignmentVisual =
  | AlignmentLineVisual
  | AlignmentBandVisual
  | AlignmentPointVisual
  | AlignmentBadgeVisual;

export type AlignmentProposal = {
  id: string;
  axis: AlignmentAxis;
  kind: AlignmentGuideKind;
  delta: number;
  score: number;
  lockKey: string;
  visuals: AlignmentVisual[];
  targetSubjectIds: string[];
  sourceGuides: SmartGuideLine[];
};

export type AlignmentOverlayModel = {
  visuals: AlignmentVisual[];
};

export type AlignmentPreferences = {
  enabled: boolean;
  snapEnabled: boolean;
  showSpacingGuides: boolean;
  showContainerGuides: boolean;
  showViewportCenterGuides: boolean;
  strictness: 'soft' | 'default' | 'strict';
};

export const DEFAULT_ALIGNMENT_PREFERENCES: AlignmentPreferences = {
  enabled: true,
  snapEnabled: true,
  showSpacingGuides: false,
  showContainerGuides: false,
  showViewportCenterGuides: false,
  strictness: 'default',
};

export function mergeAlignmentPreferences(
  overrides: Partial<AlignmentPreferences> = {}
): AlignmentPreferences {
  return {
    ...DEFAULT_ALIGNMENT_PREFERENCES,
    ...overrides,
  };
}

export function resolveAlignmentVisualEmphasis(
  kind: AlignmentGuideKind,
  primary: boolean
): AlignmentVisualEmphasis {
  if (kind === 'spacing') {
    return 'measurement';
  }
  if (kind === 'container' || kind === 'viewport-center') {
    return 'structural';
  }
  return primary ? 'primary' : 'secondary';
}

export type AlignmentSessionState = {
  lockedProposalX: string | null;
  lockedProposalY: string | null;
};

export type AlignmentEngineInput = {
  movingSubject: AlignmentSubject | null;
  referenceSubjects: AlignmentSubject[];
  virtualSubjects?: AlignmentSubject[];
  mode: AlignmentInteractionMode;
  preferences: AlignmentPreferences;
  previousSession: AlignmentSessionState;
};

export type AlignmentEngineOutput = {
  proposals: AlignmentProposal[];
  overlay: AlignmentOverlayModel;
  snapDeltaX: number;
  snapDeltaY: number;
  nextSession: AlignmentSessionState;
};
