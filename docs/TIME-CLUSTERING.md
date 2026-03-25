# Time Clustering

## Status

- State: discovery
- Started: 2026-03-25
- Last updated: 2026-03-25
- Document type: living product and UX notes

## Working Name

- Product-facing name: `Time Clustering`
- Technical module id (proposed): `time-clustering`

## Why This Feature Exists

`Time Clustering` solves a practical planning gap:
users may have many tasks across different categories, and even with better prioritization,
deadlines, and weekly/day assignment, they still struggle to keep a balanced day.

Without explicit time boundaries, a user can over-focus on one project or one task type
and unintentionally neglect other important areas (health, rest, learning, relationships, etc.).

The feature introduces explicit day-level time clusters so users can protect time blocks
for important life and work categories and distribute actionable work inside those boundaries.

## Product Intent

- Split each day into meaningful time clusters.
- Let users reserve and protect time for key categories.
- Allocate actionable items into these clusters.
- Reduce planning overload by turning “too many tasks” into a clearer daily structure.
- Keep personal balance visible (work, health, recovery, social, learning, etc.).

## Example Cluster Categories

- Sport
- Meditation
- Rest
- Cooking / meals
- Work
- Learning
- Social connection

> Categories above are examples; final taxonomy is user-defined.

## Confirmed Decisions (2026-03-25)

### Stage 1 delivery boundary (prototype mode)

- Stage 1 is frontend-only and is not integrated with backend APIs.
- Stage 1 data is stored in browser local storage.
- Stage 1 storage key convention (initial): use `time_clusters_v1` as the primary local-storage key.
- Stage 1 scope is limited to cluster creation and cluster visualization correctness.
- Stage 1 does **not** include assigning tasks/habits into clusters yet.
- Task/habit assignment is deferred to a later stage together with the `Resource Planner` feature.
- AI in Stage 1 should consider existing clusters and suggest cluster distribution for a day or week.
- AI suggestions in Stage 1 should be actionable (button-driven apply flow), not only informational text.

> Note: unless explicitly marked as Stage 1 behavior, decisions below describe the target operating model for later stages.

### 1) Cluster creation model

- There is no mandatory default cluster set.
- Users create clusters manually.
- AI may suggest useful clusters, but suggestions are optional.

### 2) Cluster overlap rules

- Overlap is allowed only when two clusters represent activities that can truly be done in parallel.
- If activities are not realistically parallelizable, overlap is not allowed.
- Overlap logic is tied to real-world execution feasibility.

### 3) Capacity overflow and backlog

- Each cluster has a backlog.
- If items do not fit in a cluster today, they are carried to the next day.
- Items not completed on previous days are also carried forward (with type-specific handling noted below).

### 4) Allowed item types inside clusters

- Allowed: `Task`, `Habit`.
- Not allowed: `Story`, `Goal`.
- Rationale: clusters contain concrete executable actions, while stories/goals are strategic grouping levels.

### 5) One item in one cluster (v1 default)

- Current default assumption: one actionable item belongs to one cluster at a time.
- Future flexibility may be explored if strong product cases appear.

Potential future case for multi-cluster assignment:

- Example: long-running research task split into `Deep Work` (analysis) and `Communication` (stakeholder sync).
- For v1, this should still be represented as separate sub-tasks rather than one task in two clusters.

### 6) Cluster enforcement stance

- Product direction is closer to strict assignment semantics:
  actionable items should be assigned to a matching cluster, not left unstructured.
- The exact UX strictness (hard blocks vs guided guardrails) remains a design detail.

### 7) Prioritization ownership

- Time Clustering does not own internal item ordering/prioritization logic.
- Prioritization is delegated to the planned `Resource Planner` feature.
- In Stage 1, assignment of actionable items is not implemented; cluster planning is structural only.
- Time Clustering becomes a time-bound routing layer (“pipeline”) after assignment is enabled in later stages.

### 8) Adaptivity and rhythm

- Cluster structure should be adaptive over time.
- Day templates may differ by weekday and user rhythm.
- AI-assisted suggestions should eventually use behavior signals to recommend healthier alternation patterns
  (focus vs recovery, context switching, cadence).

### 9) Day view behavior

- Day view is primarily an informational view.
- Default focus: today.
- Supports quick navigation to previous/next day.
- Editing of cluster structure is not required in this compact day-focused mode by default.

### 10) Fullscreen week behavior

- Week view is mandatory in fullscreen mode.
- Primary purpose: forward planning of cluster distribution for upcoming days/week,
  with optional AI guidance.

### 11) Balance metrics and nudges

- Balance metrics are in scope as supportive feedback.
- AI-based recommendations are desirable.
- Nudges should be helpful and subtle, not intrusive.

### 12) Carry-over rules by item type (initial)

- `Habit`: generally appears again by its recurrence logic; do not treat as naive carry-over clone.
- `Task`: usually carried/replanned forward if incomplete, with exceptions for date-specific hard-deadline tasks
  (e.g., airport transfer) that may require separate handling.

### 13) Mobile posture (current)

- Dedicated mobile mode is not critical for first increment.
- On small screens, only one major workspace surface is expected to be visible at a time
  (time clustering OR canvas OR AI assistant).

### 14) Day-to-day duplication behavior (Stage 1)

- Stage 1 supports one-off day template duplication (copy full day).
- Collision policy in Stage 1: keep-both and show a warning indicator; no automatic destructive overwrite.
- Recurrence-based duplication (e.g., weekdays rule) is deferred beyond Stage 1.

## Relationship To Other Planned Features

This feature should integrate with, but remain distinct from:

- `Resource Planner` (planned feature; prioritization, sequencing, resource constraints)
- planning branches (planned feature)

Current assumption:

- Resource/branch features choose and sequence work,
- Time Clustering distributes selected work into realistic day-time boundaries.
- AI chat integration must include cluster-context access; current canvas-centric context assumptions are not sufficient for Time Clustering suggestion flows.

## Core UX Concept

The visual model should resemble a calendar timeline,
but instead of classic event-centric scheduling,
it emphasizes daily time zones (clusters).

Users should see what clusters exist for today.
In Stage 1, focus is cluster structure and visibility; routing actionable items is deferred to later stages.

## Required Views (initial)

### 1) Day View (compact)

- Compact day-focused presentation used when screen space is constrained or when a narrow side panel is preferred.
- Focused “today” view with day timeline and active clusters.
- Informational-first: shows sequence, context, and quick day navigation.

### 2) Fullscreen View

- Primary planning surface for broader horizon.
- Must include week mode.
- Month mode is optional and must be validated by product value before commitment.

## Remaining Open Questions

1. Should overlap validation be manual (user decides) or rule-assisted (system detects impossible overlaps)?
2. How should hard-deadline tasks be represented so carry-over does not hide missed commitments?
3. What is the minimal v1 signal set for AI cluster recommendations (history, energy pattern, category balance)?
4. Should users be able to pin “non-negotiable” clusters (sleep, medication, commute) before work allocation?
5. What exact balance metrics should appear first (time share per category, uninterrupted focus depth, recovery ratio)?

## Initial Non-Goals

- Full autonomous AI scheduler from day one.
- Complex collaboration workflows in v1.
- Deep monthly analytics before core day/week flow is validated.

## Minimum Viable Outcome (draft)

### Stage 1 (current target)

A user can:

1. create daily time clusters manually,
2. receive AI suggestions for cluster distribution across day/week and apply them via explicit action controls,
3. view clusters in day and week contexts,
4. store and restore cluster plans in browser local storage,
5. edit/delete clusters and validate visual layout behavior.

### Stage 2+ (future target)

- Assign `Task` and `Habit` items into clusters.
- Activate backlog/carry-over behavior for actionable items.
- Track completion visibility inside each cluster with planner-driven ordering.

