# Learning Studio Implementation Restart Plan

## Status

- State: execution planning
- Updated: 2026-03-27
- Scope: concrete restart plan for replacing the discarded prototype with a cleaner implementation path
- Related docs:
  - `docs/LEARNING-STUDIO.md`
  - `docs/LEARNING-STUDIO-IMPLEMENTATION-BLUEPRINT.md`
  - `docs/LEARNING-STUDIO-AUTHOR-UX-SPEC.md`
  - `docs/LEARNING-STUDIO-LEARNER-UX-SPEC.md`
  - `docs/LEARNING-STUDIO-BUILD-INTERACTION-SPEC.md`
  - `docs/LEARNING-STUDIO-STRUCTURED-LESSON-FORMAT-SPEC.md`
  - `docs/LEARNING-STUDIO-CORE-CANVAS-MIGRATION-STRATEGY.md`

## Why this plan exists

The initial `Learning Studio` prototype proved some architectural wiring, but it also produced a primitive UI and interaction model that should not be evolved further.

The current decision is:

- keep the page visually cleared
- treat the existing prototype UI as disposable
- preserve only the foundations that are still useful
- restart implementation from a cleaner, spec-driven baseline

This document defines exactly how to do that.

## Core Restart Decision

Recommended implementation stance:

- do **not** iterate on the previous prototype UI
- do **not** treat the previous fake-canvas or screen mix as a base to polish
- do keep module wiring, local prototype boundaries, and selected infrastructure hooks

In other words:

- restart the product surface
- keep only the infrastructure that still helps

## Current UI State

The page is intentionally reduced to a redesign placeholder.

That state is correct for now.
It prevents more prototype noise from accumulating while the interaction model is reset.

## Keep / Rewrite / Discard

## Keep as foundation

These should remain as the technical foundation:

- `src/features/learning-studio/LearningStudioModule.ts`
- `src/features/learning-studio/index.ts`
- shell/module registration in:
  - `src/bootstrap/RuntimeHost.ts`
  - `src/bootstrap/GlobalAppHeader.ts`
  - `src/features/shell/WorkspaceControlsBar.ts`
  - `src/features/shell/WorkspaceView.ts`
  - `src/features/shell/WorkspaceViewSwitcher.ts`
  - `src/features/shell/workspaceUiState.ts`
  - `src/features/shell/workspaceEvents.ts`
- dev flag wiring in:
  - `src/config/env/index.ts`
  - `src/env.d.ts`

These pieces already establish:

- workspace entry
- module mounting
- feature gating
- future room for incremental reintroduction

## Keep, but rewrite internally

These files may keep their role but should be considered rewrite targets, not stable product implementations:

- `src/features/learning-studio/LearningStudioApp.ts`
- `src/features/learning-studio/data/LocalStorageLearningStudioRepository.ts`
- `src/features/learning-studio/domain/types.ts`

Why:

- `LearningStudioApp.ts` still carries prototype state transitions that were built before the final UX contracts converged
- `LocalStorageLearningStudioRepository.ts` is still useful as a local-first persistence boundary, but its stored shapes should now follow the new specs
- `domain/types.ts` is a useful seed, but it must be realigned with the structured lesson format, learner runtime rules, and future canvas migration boundary

## Discard as product surface

These should be treated as disposable prototype UI and should not be evolved into the new product:

- `src/features/learning-studio/ui/components/LearningStudioRootView.ts`
- `src/features/learning-studio/ui/components/LearningStudioAccessView.ts`
- `src/features/learning-studio/ui/components/LearningStudioSettingsView.ts`

The same applies to the old interaction assumptions baked into their tests:

- `src/features/learning-studio/ui/components/LearningStudioRootView.test.ts`
- `src/features/learning-studio/ui/components/LearningStudioAccessView.test.ts`
- `src/features/learning-studio/ui/components/LearningStudioSettingsView.test.ts`

They may remain temporarily while the placeholder is active, but they should not define the next UI architecture.

## Keep only as temporary safety net

The placeholder state itself is not part of the future product.
It exists only to keep the module quiet while documentation and restart planning complete.

## Restart Principles

The new implementation pass must obey these rules:

- start from the spec set, not from the discarded prototype UI
- rebuild screen hierarchy and runtime modes intentionally
- keep renderer decisions separate from product interaction rules
- rebuild `Build`, `Preview`, and learner runtime as separate surfaces with shared domain state
- avoid recreating equal-weight top-level mode buttons

## Phase Order

## Phase 0 — Freeze and cleanup

Goal:

- keep the placeholder visible
- avoid adding any new UX behavior to the old prototype
- use docs as the source of truth

Allowed work:

- documentation only
- infrastructure cleanup if it does not revive old UI behavior

## Phase 1 — Re-establish the domain and runtime skeleton

Goal:

- rebuild the non-visual core cleanly before the new UI surfaces

Deliverables:

- revised domain types aligned with:
  - publication/versioning
  - progress/assessment
  - preview/runtime separation
  - structured lesson format
- rewritten local repository contract
- cleaner app state model for:
  - selected course
  - build mode
  - preview mode
  - learner mode
  - inspector state
  - layout state

Important constraint:

- do not rebuild the old placeholder shell into a “better prototype”

## Phase 2 — Rebuild creator-facing screens

Goal:

- reintroduce the creator flow in the correct order

Order:

1. `Home`
2. `Course Overview`
3. `Build`
4. `Preview`

Important:

- `Share`, `Settings`, and `Publish` remain secondary surfaces
- `Build` must follow the interaction contract already documented

## Phase 3 — Rebuild real learner runtime

Goal:

- implement learner-facing consumption separately from creator preview

Order:

1. Enrolled courses home
2. Learner course home
3. Lesson runtime
4. Course completion surface

Important:

- learner runtime must use the learner UX spec
- it must not be a renamed creator preview

## Phase 4 — Prepare renderer abstraction

Goal:

- make the center workspace ready for future migration to a dedicated learning canvas

Deliverables:

- stable layout state boundary
- stable selection boundary
- stable renderer-facing data contract

At this phase, the product may still be block-based.
That is acceptable if the interaction contract is already correct.

## First Clean Implementation Increment

The first implementation increment after restart should be intentionally small.

Recommended first clean increment:

- rework the domain and repository contracts
- rebuild `Home` and `Course Overview`
- leave `Build`, `Preview`, and learner runtime hidden or partial until their foundations are correct

Reason:

- this reintroduces the module with low UX risk
- it avoids immediately falling back into noisy structural authoring UI
- it lets the next pass build `Build` on stable data and navigation decisions

## First Clean UI Deliverable

The first creator-facing UI that should feel legitimately usable is:

- `Home`
- `Course Overview`

Not:

- a fake-canvas `Build`
- a mixed creator/learner screen
- admin surfaces promoted as primary destinations

## Second Implementation Increment

After the first clean increment, the next pass should be:

- rebuild `Build` using the build interaction spec

Only after `Build` is structurally sound should the team reintroduce:

- `Preview`
- learner runtime

## Third Implementation Increment

After `Build` is stable:

- implement creator `Preview`
- then implement real learner runtime

This order matters because:

- preview depends on build structure
- learner runtime depends on preview/runtime separation and progress rules

## Files to revisit first

Recommended first rewrite targets:

- `src/features/learning-studio/domain/types.ts`
- `src/features/learning-studio/data/LocalStorageLearningStudioRepository.ts`
- `src/features/learning-studio/LearningStudioApp.ts`

Recommended first new UI composition targets:

- a replacement for `Home`
- a replacement for `Course Overview`

Recommended last major UI rewrite target:

- `src/features/learning-studio/ui/components/LearningStudioRootView.ts`

This file should become a much thinner composition root, not the place where the entire product is improvised again.

## Explicit Anti-Goals for the Restart

Do not:

- polish the old prototype cards into the new UX
- rebuild equal-weight `Home / Build / Learn / Access / Settings` navigation
- grow the fake-canvas metaphor again
- mix real learner runtime and creator preview
- overfit the new learning model to current planning-canvas entity assumptions

## Exit Criteria for Leaving Placeholder State

The placeholder should be removed only when all of the following are true:

- revised domain types are in place
- repository contract is aligned with the new docs
- creator `Home` and `Course Overview` are rebuilt cleanly
- route/state model follows the new IA
- no old prototype navigation model remains visible

If these are not true yet, the placeholder is safer than half-reviving the old experience.

## Documentation-Driven Gates

Implementation should not restart before these documents are treated as binding inputs:

- `docs/LEARNING-STUDIO-AUTHOR-UX-SPEC.md`
- `docs/LEARNING-STUDIO-LEARNER-UX-SPEC.md`
- `docs/LEARNING-STUDIO-BUILD-INTERACTION-SPEC.md`
- `docs/LEARNING-STUDIO-PREVIEW-LEARNER-RUNTIME-SPEC.md`
- `docs/LEARNING-STUDIO-PROGRESS-ASSESSMENT-SPEC.md`
- `docs/LEARNING-STUDIO-STRUCTURED-LESSON-FORMAT-SPEC.md`
- `docs/LEARNING-STUDIO-CORE-CANVAS-MIGRATION-STRATEGY.md`

## What still remains open after this plan

This restart plan does not replace:

- planning synchronization rules
- AI trust and approval policy
- success metrics and telemetry decisions

Those still matter, but they no longer block the product reset itself.

## Recommended Next Step

After this plan, the next most useful move is:

- a small cleanup pass to align `LEARNING-STUDIO.md` and `LEARNING-STUDIO-IMPLEMENTATION-BLUEPRINT.md` with this restart plan if needed
- then return to code with `Phase 1` only
