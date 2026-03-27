# Learning Studio Progress and Assessment Spec

## Status

- State: decision draft
- Updated: 2026-03-27
- Scope: learner progress semantics, completion rules, next-step logic, and v1 assessment boundaries
- Related docs:
  - `docs/LEARNING-STUDIO.md`
  - `docs/LEARNING-STUDIO-IMPLEMENTATION-BLUEPRINT.md`
  - `docs/LEARNING-STUDIO-AUTHOR-UX-SPEC.md`
  - `docs/LEARNING-STUDIO-PUBLICATION-ACCESS-VERSIONING-SPEC.md`

## Why this spec exists

`Learning Studio` cannot move beyond a superficial prototype until the product has explicit rules for:

- what it means to start a lesson
- what it means to complete a lesson, exercise, or checkpoint
- how the system chooses the learner's next step
- what `review` means after completion
- whether exercises and checkpoints are decorative blocks or real progression gates

Without these rules, the following remain unstable:

- progress bars
- completion percentages
- next-step recommendations
- learner state persistence
- preview behavior
- backend enrollment/progress contracts

## Problem Statement

The previous discussions left these questions unresolved:

- whether progress is manual, automatic, or mixed
- whether a lesson can be completed without completing its child exercises
- whether `review` is a blocker or a post-completion follow-up state
- whether checkpoints are just labeled lessons or explicit completion gates
- whether creator preview should write into real learner progress

This document defines the recommended v1 behavior.

## Recommended v1 Product Position

For v1, `Learning Studio` should optimize for:

- simple and trustworthy progress semantics
- explicit learner control over completion
- minimal assessment logic
- clear next-step guidance
- stable progress tied to a published course version

It should **not** try to solve in v1:

- automatic grading engines
- AI-based scoring as a required path
- teacher-reviewed submissions
- attempt history and rubric systems
- progress migration across changed course versions
- sophisticated spaced repetition or mastery models

## Core Learning Units

### Lesson

A lesson is the primary learning unit.
It contains instructional content and may contain child exercises or checkpoints.

### Exercise

An exercise is a practice unit.
In v1, it represents work the learner is expected to do, but not an automatically graded assessment.

### Checkpoint

A checkpoint is a stronger confirmation gate than a normal exercise.
It exists to make sure the learner pauses and explicitly confirms readiness before moving on.

## Required v1 Simplification

For v1, all lessons, exercises, and checkpoints should be treated as required by default.

Out of scope for v1:

- optional content
- bonus exercises that do not affect course completion
- partial credit models

This keeps course progress understandable and prevents ambiguous completion percentages.

## Progress State Model

Recommended v1 states:

- `locked`
- `available`
- `in_progress`
- `completed`
- `review`

### Locked

The learner cannot start the unit yet because prerequisites are not satisfied.

### Available

The learner is allowed to open the unit, but has not meaningfully started it yet.

### In Progress

The learner has started engaging with the unit, but has not satisfied completion rules.

### Completed

The learner has satisfied the completion rule for the unit.

### Review

The learner completed the unit previously, but the system or author wants it revisited.

Critical v1 rule:

- `review` should **not** revoke downstream unlocks once the unit was already completed.

It is a follow-up state, not a regression to incomplete.

## Unit State Entry Rules

### Lesson

A lesson enters:

- `locked` when prerequisites are unmet
- `available` when prerequisites are satisfied and the learner has not opened it
- `in_progress` when the learner opens the lesson or records any meaningful interaction inside it
- `completed` when the lesson completion rule is satisfied
- `review` when the lesson was completed earlier and later marked for revisit

### Exercise

An exercise enters:

- `locked` only if its parent lesson is not yet available or if the exercise itself has explicit prerequisites
- `available` when the learner can attempt it
- `in_progress` when the learner begins interacting with it
- `completed` when the learner explicitly marks it complete
- `review` when it was completed before and later flagged for revisit

### Checkpoint

A checkpoint follows the same basic state machine as an exercise, but has stronger semantic meaning:

- it should be treated as an explicit validation moment
- it should appear as a clearer progression gate in the learner flow

In v1, it is still completed manually.

## Completion Rules

### Lesson completion rule

Recommended v1 rule:

- a lesson is completed when the learner explicitly marks the lesson complete
- and all child exercises/checkpoints inside that lesson are completed

If a lesson has no child exercises or checkpoints:

- explicit learner completion is enough

This avoids a misleading experience where the learner marks a lesson done while required practice remains unfinished.

### Exercise completion rule

Recommended v1 rule:

- an exercise is completed only when the learner explicitly marks it complete

The system should not assume completion from simply opening or viewing it.

### Checkpoint completion rule

Recommended v1 rule:

- a checkpoint is completed only when the learner explicitly marks it complete

In v1, checkpoints are not auto-scored and do not require rubric evaluation.

## Manual vs automatic completion

Recommended v1 behavior:

- progress should be **mixed**, but completion should stay explicit

This means:

- opening a unit can move it to `in_progress`
- completion must still be explicitly confirmed by the learner

This is safer and easier to trust than trying to infer completion from page views alone.

## Next-Step Recommendation Rules

Recommended v1 priority order:

1. Resume the earliest `in_progress` required unit.
2. If nothing is `in_progress`, recommend the earliest `available` required unit in sequence.
3. If a lesson is open but blocked by incomplete child exercises/checkpoints, recommend the first incomplete required child item.
4. If all required units are completed, recommend course review or show course completion.

This makes the learner experience deterministic and easy to explain.

## Sequencing Rule

Recommended v1 rule:

- sequence should be primarily linear within a module
- prerequisites may block lessons
- the learner should still receive one dominant recommended next step

Even if the underlying topology later becomes more graph-like, v1 should avoid giving the learner multiple equally important next actions.

## Progress Summary Rules

### Course completion percentage

Recommended v1 formula:

- completed required units / total required units

### Module completion percentage

Recommended v1 formula:

- completed required units inside the module / total required units inside the module

### Course completed

A course is completed when:

- every required lesson, exercise, and checkpoint in the enrolled published version is completed

### Review-needed signal

A course or module may show `review needed` when:

- at least one completed unit is now in `review`

But:

- the course should still remain completed if all required units were already completed once

## Assessment Positioning for v1

Recommended v1 definition:

- lessons teach
- exercises practice
- checkpoints confirm

What assessment does **not** mean in v1:

- scoring engine
- pass/fail grading scale
- AI-evaluated correctness as a mandatory step
- teacher-reviewed submissions
- multiple-attempt grading history

This is intentionally conservative.
The first version should prove progression and trust before introducing sophisticated evaluation mechanics.

## Preview Boundary

Minimal rule needed now:

- creator `Preview` must not write into real learner progress

Recommended v1 behavior:

- creator preview uses sandbox progress state
- real learner progress belongs only to an enrollment on a published course version

This preserves trust in learner analytics and completion summaries.

## Versioning Dependency

This spec depends on the publication/versioning rules already defined in:

- `docs/LEARNING-STUDIO-PUBLICATION-ACCESS-VERSIONING-SPEC.md`

Critical dependency:

- progress attaches to an enrollment on a published version
- draft edits must not mutate existing learner progress records

## Suggested Domain Implications

The domain should eventually be able to represent at least:

- `state`
- `started_at`
- `completed_at`
- `review_requested_at`
- `last_opened_at`
- `completion_method`
- `enrollment_id`
- `course_version_id`

Recommended v1 completion methods:

- `manual`
- `auto_progress_to_in_progress`
- `sandbox_preview`

## Explicitly Out of Scope for v1

- quiz scoring
- answer validation engines
- AI grading as a required path
- attempt counts and retry policies
- grading rubrics
- certificate rules
- prerequisite graphs with many competing next steps
- cross-version progress migration

## Decisions This Spec Resolves

- progress is primarily explicit, not purely inferred
- lessons cannot be truthfully completed while required child work remains incomplete
- `review` is a post-completion follow-up state, not a hard reset
- exercises and checkpoints are real progression units, not decorative labels
- creator preview must use sandbox progress, not live learner progress

## Recommended Next Documentation Step

After this spec, the next most useful clarification is:

- `Preview vs Real Learner Runtime`

That document should define:

- creator preview entrypoint
- learner entrypoint
- what UI and metadata differ between them
- which actions are hidden or disabled in preview vs real learner mode
