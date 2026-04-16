# Majom Operating Loop State And Invariants

## Status

- State: proposal
- Started: 2026-04-15
- Scope: define the tactical source of truth and hard state rules for the operating loop

## Why This Document Exists

The repository currently has:

- strategic canvas state,
- kanban board state,
- time clustering state,
- AI session state.

The operating loop needs one tactical state owner between those layers.

Without that owner, the same meaning would be spread across:

- canvas selection and layout,
- kanban column distribution,
- time blocks,
- and assistant suggestions.

That would be architecturally weak and patch-heavy.

## Single Owner Decision

The operating loop must have one authoritative tactical state container.

Recommended owner:

- a new feature module, for example `src/features/operating-loop/*`

Recommended source of truth:

- one tactical snapshot stream,
- one reducer/transition owner,
- one persistence boundary.

## Tactical State Shape

```ts
export type OperatingLoopSnapshot = {
  version: 1;
  canvasId: string;
  cycle: {
    id: string;
    title: string;
    startsOn: string | null;
    endsOn: string | null;
    mainContourId: string | null;
    supportContourIds: string[];
    adminContourIds: string[];
    parkedContourIds: string[];
  };
  contours: ContourRecord[];
  realityContacts: RealityContactRecord[];
  accessRules: AccessRuleRecord[];
  dayPlan: DayPlanRecord | null;
  recovery: RecoveryRecord | null;
  diagnostics: {
    activeFrontCount: number;
    wipViolation: boolean;
    missingRealityContactContourIds: string[];
    invalidRoleAssignments: string[];
  };
  updatedAtIso: string;
};
```

## Day Plan Shape

```ts
export type DayPlanBlockKind =
  | 'main'
  | 'support'
  | 'reactive_admin'
  | 'buffer_recovery';

export type DayPlanBlockRecord = {
  id: string;
  kind: DayPlanBlockKind;
  contourId: string | null;
  title: string;
  startsAtIso: string | null;
  endsAtIso: string | null;
  protected: boolean;
};

export type DayPlanRecord = {
  dateKey: string;
  blocks: DayPlanBlockRecord[];
  protectedMainBlockId: string | null;
  startedReactiveFirst: boolean;
};
```

## Required Invariants

These invariants should be treated as hard tactical rules.

### Main Contour Invariants

- At most one contour may have role `main`.
- `cycle.mainContourId` must match exactly one contour with role `main`.
- If a `main` contour exists, it must be active and not archived.

### Support Invariants

- Support contours must be active.
- The count of active support contours should be limited to `2` in MVP.
- A support contour must not silently promote itself to `main`.

### Parked Invariants

- Parked contours must not count toward active fronts.
- A parked contour must not appear in `dayPlan.blocks`.
- Moving `parked -> support` or `parked -> main` must be an explicit transition.

### WIP Invariants

- `activeFrontCount` should equal `main + support + qualifying admin fronts`.
- In MVP, valid active serious fronts are:
  - `1 main`
  - `0-2 support`
- If active serious fronts exceed the allowed limit, `wipViolation` must be true.

### Reality Contact Invariants

- Every active `main` contour must have at least one non-cancelled reality contact.
- A day that executes the main contour without any current or upcoming reality contact should be marked structurally weak.

### Day Architecture Invariants

- A valid day must allow at most one `main` block.
- If a `main` contour exists, the day should contain one `main` block.
- A protected `main` block must not be placed after the first reactive/admin block in a healthy default plan.

### Access Rule Invariants

- If a block is marked protected, interruption rules must be derivable for it.
- If no access rules exist, the system should surface that absence as a planning weakness rather than silently ignoring it.

### Recovery Invariants

- At most one unresolved recovery record should be active for a cycle.
- A recovery record must define a minimal restart set, not a full-system reset.

## Transition Rules

The store should expose explicit tactical transitions.

Recommended minimum transition set:

- `setMainContour`
- `setContourRole`
- `parkContour`
- `activateContour`
- `attachRealityContact`
- `markRealityContactStatus`
- `buildDayPlan`
- `protectMainBlock`
- `setAccessRules`
- `startRecovery`
- `resolveRecovery`

## Transition Constraints

### `setMainContour`

Must:

- demote previous `main` to `support` or `parked`,
- ensure exactly one new `main`,
- recompute diagnostics,
- validate reality contact requirement.

### `setContourRole`

Must:

- reject invalid combinations,
- recompute all role collections,
- update active-front diagnostics.

### `parkContour`

Must:

- remove contour from `main`, `support`, and active day allocations,
- update WIP diagnostics immediately.

### `buildDayPlan`

Must:

- derive blocks from tactical state,
- not invent extra active contours,
- preserve the main-first rule by default.

### `startRecovery`

Must:

- classify severity,
- store breakpoint,
- define minimal restart set.

## Diagnostics Layer

The tactical state should produce explicit diagnostics rather than hiding invalid structure.

Recommended diagnostics:

- `wipViolation`
- `missingMainContour`
- `multipleMainContours`
- `missingRealityContactContourIds`
- `dayStartsReactiveFirst`
- `parkedContourLeakingIntoDayPlan`
- `protectedBlockWithoutAccessRules`
- `supportOverflow`

## Derived Projections

The tactical store should feed other surfaces through projections.

### Kanban projection

Should derive:

- `now`
- `next`
- `queue`
- `done`

from tactical state, not from date buckets alone.

### Time clustering projection

Should derive:

- `main`
- `support`
- `reactive_admin`
- `buffer_recovery`

blocks from tactical state, not from unconstrained free-form authoring alone.

### AI projection

Should expose:

- current main contour,
- support load,
- WIP violations,
- missing reality contacts,
- active recovery state,
- current day shape.

## Anti-Patterns To Avoid

Do not let the tactical meaning be reconstructed independently from:

- kanban columns,
- canvas selection,
- time clustering blocks,
- AI memory,
- or local UI flags.

Each of those may project tactical state.
None of them should become its hidden owner.

## Implementation Guidance

If this state model is added incrementally:

1. start with the smallest valid snapshot,
2. implement invariants before polished UI,
3. expose diagnostics before automation,
4. keep transitions explicit and typed.

That sequence reduces drift and keeps the tactical layer defensible.
