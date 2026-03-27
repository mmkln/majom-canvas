# AI-Native Incremental Refactoring Guide

## Purpose

This guide defines a mandatory, repeatable way to evolve Majom Canvas into a more AI-operable codebase **during normal feature and bug work**, without full rewrites.

The objective is simple: each implementation task should leave the touched area more explicit, more machine-checkable, and easier to modify safely.

## Scope

This policy applies to:

- new features;
- bug fixes;
- edits to existing functionality;
- refactors that touch runtime behavior.

This policy does **not** require broad migrations in one task.

## Core Policy (Mandatory)

For every implementation task, contributors must:

1. Deliver the requested behavior.
2. Apply at least one small AI-native refactor in touched code.
3. Preserve behavior unless behavior changes are explicitly requested.
4. Report the AI-native refactor in the final task summary.

"AI-native refactor" means a local change that improves explicit contracts, invariants, reactive-channel clarity, or reusable composition.

## Refactor Budget And Safety Limits

Use a small local budget by default:

- approximately 5-15% extra diff in touched modules, **or**
- 1-3 focused micro-refactors.

Guardrails:

- Keep scope local to task area.
- Do not block requested delivery for broad architecture cleanup.
- Prefer deterministic, low-risk changes over aesthetic refactors.

## Required Output Per Task (Measurable)

At least one of the following outcomes must appear in the diff:

1. **Contract hardening**: typed payload/interface/guard replaces implicit shape.
2. **Invariant codification**: explicit guard/assert/helper for an existing rule.
3. **Reactive simplification**: duplicate event/stream pathway removed or unified.
4. **Reuse improvement**: feature-local UI duplication replaced with ui-lib/HUD primitive or variant.
5. **Runtime clarity**: app-level runtime concern moved or kept behind `AppRuntime` boundary.

If none is safe, use the waiver format in this guide.

## Approved Micro-Refactors (Default Menu)

When modifying existing functionality, choose one or more:

1. **Extract implicit rules into typed constants/maps**
   - Move repeated condition/label/class rules into typed option maps.

2. **Consolidate duplicated reactive pathways**
   - Remove parallel events/streams representing one state transition.

3. **Strengthen boundary typing**
   - Replace loosely typed payloads with explicit interfaces/guards.

4. **Promote reusable UI patterns into ui-lib/hud when truly reusable**
   - Replace feature-local duplicates with existing primitives or add reusable variant.

5. **Codify invariants near domain logic**
   - Add guard functions/assertions for existing project invariants.

6. **Reduce hidden translation/runtime coupling**
   - Keep app-level runtime concerns flowing through `AppRuntime`.

7. **Normalize naming and responsibility boundaries**
   - Clarify stream/event naming and ownership boundaries.

## Priority Order

When multiple options are available, prioritize:

1. Safety-critical invariant enforcement.
2. Reactive pathway deduplication.
3. Boundary typing and payload contracts.
4. Reusable primitive consolidation.
5. Styling/token normalization.

## Module Playbook (What To Improve First)

### `src/features/canvas/**`

- Prefer invariant guards around connection and relation operations.
- Reduce duplicate reactive transitions between scene/runtime and module stores.

### `src/ui-lib/**` and feature UI modules

- Consolidate repeated class recipes into typed variant maps.
- Promote repeated feature-local controls to ui-lib/HUD only when reusable.

### `src/app-runtime/**` + root views

- Keep app-global runtime state behind `AppRuntime`.
- Ensure mounted roots use subscribe/unsubscribe lifecycle with explicit refresh boundaries.

### `src/majom-wrapper/**` data access and mapping

- Harden DTO-to-domain mapping contracts.
- Prefer explicit mapper guards for nullable/optional backend fields.

## Waiver Policy (When Refactor Can Be Skipped)

Skipping the micro-refactor is allowed only for:

1. Emergency hotfix rollback or outage mitigation.
2. Mechanical migration where local refactor introduces unacceptable risk.
3. Generated/vendor files where manual refactor is out of scope.
4. Tiny one-line edits with no safe adjacent boundary to improve.

If skipped, the final summary must include:

- `AI-Native Refactor: Skipped`
- `Reason:` one of the allowed categories
- `Next safe opportunity:` concrete future touchpoint

## Decision Flow Per Task

1. Identify touched modules and active architecture boundaries.
2. Implement requested change.
3. Apply the smallest high-value micro-refactor from the menu.
4. Verify no regression.
5. Report the outcome using the required reporting block.

## Required Reporting Block (Final Summary)

For code changes, include:

- `AI-Native Refactor Applied:` yes/no
- `Type:` contract hardening | invariant codification | reactive simplification | reuse improvement | runtime clarity
- `What changed:` 1-3 bullets
- `Boundary/Invariant improved:` one explicit statement
- `If skipped:` reason + next safe opportunity

## What Not To Do

- Do not perform full paradigm rewrites by default.
- Do not force all channels into one universal state mechanism.
- Do not add tests that only validate static presentation details.
- Do not run broad unrelated cleanups outside task scope.

## Recommended Enforcement (CI / PR)

To move from policy to consistent behavior:

1. Add PR checklist item: "AI-native micro-refactor applied or waiver documented".
2. Add lint/validation for architectural boundaries where feasible.
3. Add lightweight invariant guard tests for high-risk domain rules.
4. Track weekly adoption: ratio of implementation PRs with applied micro-refactor.
