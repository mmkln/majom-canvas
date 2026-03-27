# Kanban Tactical & Execution Design Notes

_Last updated: March 27, 2026._

## Purpose

This document captures the current product/architecture direction for Kanban so future work can continue from the same baseline without re-discovering context.

## Context Snapshot

The workspace currently has two clearly different cognitive modes:

1. **Strategic planning** (`canvas`): goals, relations, long-horizon structure.
2. **Operational execution** (`kanban`): what to do now, in what order, with less cognitive overload.

A third mode is needed between them:

3. **Tactical planning**: resource allocation, prioritization constraints, and controlled handoff into execution.

## Current State (Explicitly Temporary)

The current Kanban behavior and task-distribution logic are **experimental** and **non-final**.

- Current columns are date/status buckets (`today`, `tomorrow`, `soon`, `overdue`, `planned`, `todo`, `done`, `cancelled`).
- The current distribution rules exist mainly as a bridge because tactical planning does not exist yet.
- Visual styling is intentionally incomplete while behavior is being validated.

## Product Direction

### Core Separation

- **Canvas remains strategic by design.**
- **Tactical layer becomes the decision engine.**
- **Kanban becomes execution-focused (not strategy-heavy).**

### Tactical Layer Candidate: Flows

Introduce/expand a dedicated tactical entity:

- **Flow** = a tactical stream of work linked to goals/stories/tasks.
- Each flow owns:
  - capacity (daily/weekly),
  - optional WIP limit,
  - intake/refill policy,
  - prioritization policy.

Tasks should move through a pipeline:

`Strategy items -> Tactical flows (capacity-filtered) -> Execution board (Kanban)`

## Expected Evolution of Kanban

### Likely to Change

1. Date/status-bucket-first assignment logic.
2. Column semantics (toward execution queues like `Now / Next / Queue`, or another execution-first variant).
3. Automation behavior (from naive push to policy-driven and explainable refill).
4. Interaction contract between tactical layer and execution layer.

### Likely to Stay

1. Module-level separation (`canvas` vs `kanban`).
2. Reactive store/view update model.
3. Fast inline task edits (title/status/priority/date) in execution context.
4. Habit/event integration as optional execution context signals.

## Automation Principles

For tactical-to-execution handoff, prefer:

- **auto-suggest before auto-force**,
- explicit user override,
- transparent refill reasons (why this task entered execution),
- capacity/WIP safety rails.

## Proposed Minimal Logical Contract (v1)

### Tactical (Flows)

- `flow.id`
- `flow.title`
- `flow.capacity_day` or `flow.capacity_week`
- `flow.wip_limit`
- `flow.priority_policy` (e.g. deadline-first, priority-first, hybrid)
- `flow.refill_threshold`

### Execution Board

- `now` (strictly limited)
- `next` (ready backlog)
- `queue` (ordered candidate list)
- `done`

### Refill Trigger Examples

- `now` drops below minimum threshold,
- task completed/cancelled,
- explicit “refill now” action,
- new tactical allocation committed.

## Non-Goals (for now)

- Final visual system decisions.
- Full UX polish and style convergence.
- Complex optimization models before basic tactical loop is validated.

## Milestones

1. **Define tactical domain contract** (flows, capacity, rules).
2. **Implement tactical-to-execution handoff rules** (no hard automation lock-in).
3. **Replace temporary Kanban distribution rules** with execution-first logic.
4. **Run usage validation** (whether execution friction decreases).
5. **Then** perform style-system convergence and visual polish.

## Open Questions

1. Should execution intake be fully automatic or confirmation-based by default?
2. Is capacity measured in task count, estimate points, or time blocks?
3. Should flows be mutually exclusive for a task or allow weighted multi-flow membership?
4. How should overdue items bypass normal capacity rules?
5. What is the minimum explainability needed for user trust in auto-refill?
