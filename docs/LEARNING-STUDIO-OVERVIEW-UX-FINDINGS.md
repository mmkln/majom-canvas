# Learning Studio Overview UX Findings

## Status

- State: research synthesis
- Updated: 2026-03-28
- Scope: creator-facing UX findings for the `Overview` screen
- Related docs:
  - `docs/LEARNING-STUDIO.md`
  - `docs/LEARNING-STUDIO-AUTHOR-UX-SPEC.md`
  - `docs/LEARNING-STUDIO-CANVAS-AUTHOR-JOURNEYS.md`
  - `docs/LEARNING-STUDIO-PUBLICATION-ACCESS-VERSIONING-SPEC.md`
  - `docs/LEARNING-STUDIO-PREVIEW-LEARNER-RUNTIME-SPEC.md`

## Why this doc exists

The product already has an author UX decision record and multiple journey/spec documents.
What was still missing was one focused synthesis for a narrower question:

- what `Overview` is actually for
- which creator scenarios it supports well
- where it currently under-informs the user
- how it should scale as the course becomes larger or closer to publication

This document records scenario findings rather than introducing a new screen.

## Core Role of `Overview`

The strongest surviving definition is:

- `Overview` is a lightweight orientation screen
- it is not the main authoring surface
- it is not the main management dashboard
- it is not a second `Course map`

Its primary jobs are:

- confirm what the course is
- summarize current structure and readiness
- explain the most appropriate next step

Its primary decision is:

- go to `Build`
- or go to `Preview`

## Modeled Scenario Set

The following creator scenarios were modeled:

- first-time creator lands on `Overview` immediately after creating an empty course
- returning creator opens a partly built draft and needs to resume work quickly
- returning creator opens a course that is structurally ready enough to validate in `Preview`
- creator opens a published course with newer unpublished draft changes
- creator opens a larger course with many modules and needs rapid orientation
- creator is looking for sharing, settings, or publish signals without wanting a full management dashboard

## Current Implementation Signals

The current repo already points in a coherent direction.

Strong current signals:

- the author UX spec defines `Overview` as the orientation screen before `Build`
- the canvas author journeys explicitly allow new creators to route through `Overview` first, but only if it remains lightweight
- the current `LearningStudioOverviewView` already keeps the surface narrow: `Course structure`, `Course basics`, and one `Next step` card
- the current test intentionally protects that lightweight shape and rejects extra clutter

At the same time, the model already knows more than the current surface shows.

`LearningStudioOverviewModel` already includes:

- `audience`
- `outcomes`
- `lifecycleState`
- `latestPublishedVersionId`
- `updatedAt`
- structure counts and per-module summaries

This means the main problem is not missing state.
It is under-using already available orientation signals.

## What Works Well

### 1. First-Time Creator on an Empty or Tiny Course

This is the strongest current case.

Healthy behavior:

- creator lands on `Overview`
- sees a small amount of editable course basics
- sees a simple structure summary
- sees one strong next step
- moves into `Build`

Why it works:

- the creator is not forced straight into a blank workspace
- the page remains calm and fast to parse
- `Overview` behaves like an orientation layer, not an admin screen

### 2. Lightweight Resume for a Small-to-Medium Draft

When the course is still clearly early-stage, the current page shape still works reasonably well.

Healthy behavior:

- creator reopens the course
- quickly confirms title, description, and rough structure
- follows the recommended next step

Why it works:

- the page avoids competing intents
- the decision surface is short enough for quick scanning

## What Breaks or Stays Weak

### 1. Returning Creator Lacks Enough Context

For a creator who already knows the course, the current screen becomes too thin.

Observed weakness:

- the page shows less context than the model actually contains
- `audience`, `outcomes`, `updatedAt`, and publication/version context are mostly absent from the UI

Why it matters:

- returning creators do not need “what is this screen” help
- they need “what changed, what is missing, and what should I do now”

### 2. `Next step` Is Too Binary

The current recommendation logic is directionally correct but too coarse.

Observed weakness:

- `nextRecommendedRoute` is only `build` or `preview`
- the current logic is driven mostly by basics readiness and a minimal structure check

Why it matters:

- the creator needs a reason, not only a route
- “Go to `Build`” is much stronger when paired with a truth such as:
  - `2 modules still need lessons`
  - `draft changes are not yet ready to preview`
- “Go to `Preview`” is much stronger when paired with a truth such as:
  - `structure is complete enough to validate flow`

### 3. Publication and Versioning Context Is Underexposed

This is one of the biggest current omissions.

Observed weakness:

- the publication/versioning spec expects `Overview` to distinguish draft state, latest published state, and learner-facing implications
- the current surface barely exposes that information

Why it matters:

- the creator should know whether a published version exists
- the creator should know whether current draft edits are still private
- the creator should understand whether a next publish affects only future learners

Without these signals, `Overview` is weaker exactly when the course is nearing real learner use.

### 4. Structure Summary Gets Too Flat at Scale

The current structure card is adequate for a small course.
It becomes weak for a larger one.

Observed weakness:

- module rows become a long scan of similar summaries
- only a narrow warning state is currently surfaced
- the page does not elevate the highest-signal readiness issues

Why it matters:

- large-course failure begins with orientation loss, not raw rendering failure
- `Overview` should help the creator infer where attention is needed without becoming a second `Course map`

### 5. Risk of Drifting into the Wrong Kind of Complexity

Two equally bad reactions are possible:

- turning `Overview` into a thin, generic placeholder screen
- turning `Overview` into a heavy management dashboard or mini-editor

The better direction is:

- stronger summary quality
- not more surface area

## Concrete Scenario Examples

### Example 1: New Empty Course

Scenario:

- creator just created a course
- no modules exist yet

Best `Overview` behavior:

- short editable basics
- empty structure summary
- one clear next step: `Build course`

Why:

- the creator needs orientation and momentum, not publication controls

### Example 2: Returning Creator on a Half-Built Draft

Scenario:

- some modules exist
- some lessons are still missing
- descriptions may still be incomplete

Best `Overview` behavior:

- structure summary remains compact
- readiness summary says what is missing
- next-step card explains why `Build` is recommended

Good example:

- `Go to Build: 2 modules still need lessons`

### Example 3: Course Is Coherent Enough to Validate

Scenario:

- structure basics are present
- the creator is likely ready to test the learner flow

Best `Overview` behavior:

- next-step card promotes `Preview`
- card explains the reason

Good example:

- `Go to Preview: structure is complete enough to validate flow`

### Example 4: Published Course with New Draft Changes

Scenario:

- a published version exists
- the creator has newer draft edits

Best `Overview` behavior:

- show that the draft is still private
- show that learners remain on the published version until the next publish
- keep publish/share deeper than the main next-step CTA

Good example:

- `Draft changes are private until you publish`
- `Learners still see the latest published version`

### Example 5: Large Course with Many Modules

Scenario:

- the course is too large for a flat list of similar module rows to be self-explanatory

Best `Overview` behavior:

- structure remains summary-level
- readiness block elevates top issues first
- `Overview` does not try to become a second navigation tree

Good example:

- `3 modules need lessons`
- `4 lessons are missing descriptions`
- `1 prerequisite issue needs review`

## Recommended Direction

### Keep `Overview` Lightweight

This remains correct and should not be reversed.

`Overview` should not become:

- a second `Build`
- a second `Course map`
- a heavy metadata editor
- a full share/settings/publish dashboard

### Make Summary Smarter

The strongest next move is to improve summary quality.

Recommended additions:

- a compact readiness summary block
- 2-4 highest-signal issues only
- a reasoned next-step explanation rather than a route label alone

### Add Minimal Lifecycle Clarity

`Overview` should show just enough lifecycle truth to support creator decisions:

- `draft` / `published` / `archived`
- whether a published version exists
- whether there are unpublished draft changes

It should not absorb the full management experience.

### Keep Structure Summary Summary-Level

`Overview` should show enough structure to orient, but not enough to replace `Build`.

Recommended rule:

- counts
- per-module summaries
- selective warnings

Avoid:

- full deep hierarchy expansion
- per-lesson editing from `Overview`
- turning it into another navigation map

## `Overview` Must Show

- course title
- short description or basics summary
- structure summary
- readiness summary
- next-step recommendation with a reason
- minimal lifecycle/published-state clarity

## `Overview` Must Not Show

- canvas authoring
- per-lesson deep editing
- full share/settings flows
- a second `Course map`
- a large management dashboard

## Final Product Rule

The strongest version of `Overview` is:

- small
- fast to parse
- truthful about readiness and lifecycle
- opinionated about the next step

In short:

- `Overview = orientation + readiness + next step`
- `Build = authoring`
- `Preview = validation`
- management remains secondary

That split survives both first-time and mature-course scenarios better than either an empty placeholder overview or a bloated dashboard.
