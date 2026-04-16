# Majom Operating Loop Domain Spec

## Status

- State: proposal
- Started: 2026-04-15
- Scope: define the product vocabulary and domain model for the Majom operating loop

## Why This Document Exists

The repository already has planning entities such as:

- `Goal`
- `Story`
- `Task`
- `Flow`

Those entities are not enough to express the Majom operating model.

The operating loop needs its own domain language so the implementation does not overload:

- task status,
- task priority,
- tags,
- date buckets,
- or free-form time clusters.

## Product Thesis

Majom should not behave like a universal planner.

Majom should behave like one connected operating machine that:

1. chooses one dominant contour,
2. downgrades everything else,
3. protects the contour in the day,
4. forces confrontation with reality,
5. restores the core quickly after breakdown.

## Core Domain Terms

### Role

`Role` is the operating weight of a work line in the current cycle.

Allowed values:

- `main`
- `support`
- `admin`
- `parked`

This is not the same thing as:

- urgency,
- importance in the abstract,
- backend task status,
- or execution completion.

### Contour

`Contour` is the smallest operating unit that the system can protect, test, and recover.

A contour is not “all work in a domain”.
It is the current active line of confrontation with reality.

It may be anchored to:

- one goal,
- one story,
- one task cluster,
- or a cross-entity tactical bundle.

### Main Contour

`Main Contour` is the one dominant line for the current operating cycle.

It is:

- singular,
- protected in the day,
- the default receiver of strongest attention,
- and the primary source of real progress accumulation.

### Support Contour

`Support Contour` is active work that is allowed to exist only because it helps the main contour or maintains the system.

Support is not co-main.

### Admin Contour

`Admin Contour` is necessary maintenance, logistics, and operational hygiene.

Admin work may be necessary but should not compete with the main contour for strategic weight.

### Parked Contour

`Parked Contour` is intentionally deactivated serious work.

Parked does not mean deleted or unimportant.
It means:

- not currently carried,
- not allowed to silently re-enter active load,
- and visible as a conscious tradeoff.

### Front

`Front` is an active serious line that currently consumes planning and execution bandwidth.

In practice:

- `main` always creates a front,
- `support` may create one,
- `admin` may create lightweight maintenance fronts,
- `parked` must not count as an active front.

### Reality Contact

`Reality Contact` is the explicit external test that prevents the system from drifting into internal planning without truth.

Examples:

- send,
- publish,
- ask,
- submit,
- ship,
- measure,
- validate,
- get reply,
- get usage evidence.

Reality contact is not “more thinking”.

### Recovery

`Recovery` is the minimal structured return path after a breakdown.

Recovery does not restore the whole plan.
Recovery restores:

- one main move,
- one support move,
- one stabilizing move.

### Access Rule

`Access Rule` defines when and how the user is interruptible.

It answers:

- what can enter the day,
- what can interrupt `main`,
- what channels stay blocked,
- when the system becomes available to reactive input.

### Day Plan

`Day Plan` is not just a list of tasks.
It is the tactical arrangement of force for one day.

Its minimum block grammar is:

- `main`
- `support`
- `reactive_admin`
- `buffer_recovery`

## Domain Objects

The operating loop needs explicit domain objects in addition to planning entities.

### Operating Cycle

Represents the current tactical cycle, such as a 30-day operating window.

Responsibilities:

- hold the dominant main contour,
- define active role assignments,
- provide the current tactical frame.

### Contour Record

Represents a tactical contour and its relation to the underlying planning structure.

Responsibilities:

- point to source planning entities,
- define role,
- define test path,
- define current tactical status.

### Day Architecture Record

Represents one day as a protected arrangement of force.

Responsibilities:

- store block sequence,
- link blocks to contour roles,
- track whether the main block was protected.

### Reality Contact Record

Represents the required truth-touch for a contour.

Responsibilities:

- define external signal type,
- define expected timing,
- track current result state.

### Access Policy Record

Represents interruption rights for the current cycle and day.

Responsibilities:

- define blocked channels,
- define allowed interrupters,
- define unlock times or conditions.

### Recovery Record

Represents the latest breakdown and the structured return path.

Responsibilities:

- classify breakdown severity,
- remember where the cycle broke,
- define minimal restart set,
- prevent overreaction in weak state.

## Domain Relationships

The recommended relationship model is:

```text
Planning entities (goal/story/task)
    ->
Contour records
    ->
Operating cycle
    ->
Day architecture / access rules / reality contacts / recovery
    ->
Execution projections (kanban, time clustering, AI guidance)
```

This keeps operating meaning above planning structure without polluting the base planning DTOs.

## Explicit Non-Equivalences

These terms must not be treated as synonyms:

- `role` != `priority`
- `role` != `status`
- `main contour` != `goal`
- `support contour` != `secondary backlog`
- `reality contact` != `task description`
- `recovery` != `undo`
- `day architecture` != `calendar buckets`

## Draft Type Shape

```ts
export type OperatingRole = 'main' | 'support' | 'admin' | 'parked';

export type ContourSourceRef = {
  kind: 'goal' | 'story' | 'task' | 'mixed';
  ids: string[];
};

export type ContourRecord = {
  id: string;
  title: string;
  role: OperatingRole;
  source: ContourSourceRef;
  summary: string;
  active: boolean;
  archived: boolean;
};

export type RealityContactRecord = {
  id: string;
  contourId: string;
  title: string;
  signalType:
    | 'send'
    | 'publish'
    | 'submit'
    | 'ask'
    | 'measure'
    | 'review'
    | 'other';
  expectedBy: string | null;
  status: 'planned' | 'sent' | 'received' | 'missed' | 'cancelled';
};

export type AccessRuleRecord = {
  id: string;
  scope: 'cycle' | 'day' | 'block';
  blockedChannels: string[];
  allowedInterrupters: string[];
  unlockAtIso: string | null;
};

export type RecoveryRecord = {
  id: string;
  severity: 'micro' | 'medium' | 'repeated';
  breakPoint:
    | 'selection'
    | 'day_start'
    | 'main_block'
    | 'support_overload'
    | 'reactive_capture'
    | 'unknown';
  restartMainContourId: string | null;
  restartSupportContourId: string | null;
  restartActionTitle: string | null;
  createdAtIso: string;
  resolvedAtIso: string | null;
};
```

## Domain Boundary Decision

The operating-loop domain should be treated as a new tactical domain.

It should not be implemented by silently extending:

- `PlatformTask`,
- `Goal`,
- `Story`,
- or current canvas node semantics.

That would blur too many concerns and make the system harder to reason about.
