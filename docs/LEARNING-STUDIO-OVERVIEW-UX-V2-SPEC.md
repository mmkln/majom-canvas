# Learning Studio Overview UX v2 Spec

## Status

- State: proposed UX contract
- Updated: 2026-03-28
- Scope: target UX for the creator-facing `Overview` screen
- Related docs:
  - `docs/LEARNING-STUDIO.md`
  - `docs/LEARNING-STUDIO-OVERVIEW-UX-FINDINGS.md`
  - `docs/LEARNING-STUDIO-AUTHOR-UX-SPEC.md`
  - `docs/LEARNING-STUDIO-CANVAS-AUTHOR-JOURNEYS.md`
  - `docs/LEARNING-STUDIO-PUBLICATION-ACCESS-VERSIONING-SPEC.md`
  - `docs/LEARNING-STUDIO-PREVIEW-LEARNER-RUNTIME-SPEC.md`

## Why this spec exists

The findings work already established that the current `Overview` surface is conceptually correct but underpowered for mature drafts, publication-adjacent states, and larger courses.

What was still missing was a concrete target contract:

- what the updated `Overview` should contain
- how it should prioritize information
- which states it must distinguish
- which actions belong here
- and what must stay out of the screen

This document turns the research findings into a proposed product-design target.

## Core Product Rule

`Overview` should remain:

- lightweight
- non-canvas
- summary-first
- decision-oriented

It should not become:

- a second `Build`
- a second `Course map`
- a heavy metadata editor
- a full management dashboard

In short:

- `Overview = orientation + readiness + next step + draft/published clarity`
- `Build = authoring`
- `Preview = validation`

## Primary User Questions

The updated `Overview` should answer four questions quickly:

1. What state is this course in right now?
2. Is it ready enough to validate or does it still need authoring work?
3. What is the single best next step?
4. If this course is already published, what is the relationship between the draft and the live learner-facing version?

If `Overview` cannot answer those questions within a short scan, it is failing its job.

## Screen Anatomy

The recommended `Overview v2` has five surfaces.

### 1. Lifecycle Strip

Position:

- full width near the top of the page

Purpose:

- give fast truth about current lifecycle and version state

Content:

- current status: `draft`, `published`, or `archived`
- whether a published version exists
- whether the current draft differs from the latest published version
- a short learner-impact hint

Examples:

- `Draft`
- `Published`
- `Archived`
- `No unpublished changes`
- `Draft changes are private until you publish`
- `Current learners stay on the published version`
- `New learners receive the latest published version`

Design rule:

- this strip must explain `draft-vs-published delta`
- it must not merely repeat the lifecycle badge already visible in the shared shell

### 2. Readiness Summary

Position:

- top of the main content column, directly below the lifecycle strip

Purpose:

- compress the most important course-quality signals into one short block

Rules:

- show only `2-4` top issues
- rank by severity and impact
- keep each item short and action-oriented
- do not render a full checklist of everything that might be missing

Good examples:

- `2 modules still need lessons`
- `4 lessons are missing descriptions`
- `1 prerequisite issue needs review`
- `Draft differs from the latest published version`

Bad examples:

- a full enumerated QA report
- per-lesson issue lists
- dozens of warnings

### 3. Structure Summary

Position:

- below the readiness summary in the main column

Purpose:

- orient the creator to the current shape of the course

Content:

- total module count
- total unit count
- per-module summary rows
- selective warnings on the most relevant module rows

Rules:

- counts first
- warnings second
- hierarchy stays summary-level
- do not expand into a second navigation tree or mini `Course map`

Recommended module row content:

- module title
- lesson count
- exercise count
- checkpoint count
- an issue chip when needed, for example:
  - `Needs lessons`
  - `Missing descriptions`

Scaling rule:

- after roughly `5-6` modules, prefer a `show more` pattern or summary-first truncation
- `Overview` should not dump a long undifferentiated list by default

### 4. Basics Block

Position:

- below the structure summary in the main column

Purpose:

- let the creator confirm or lightly adjust core course framing

Rules:

- summary-first by default
- collapsed when title and description are already present
- expandable for editing
- remain lightweight

Recommended editable scope in v2:

- title
- description

Out of scope here by default:

- heavy metadata forms
- deep audience/outcomes editing
- curriculum-level content authoring

### 5. Next Step Card

Position:

- right rail

Purpose:

- recommend one dominant next move

Rules:

- exactly one dominant primary CTA
- include one strong reason
- avoid competing equal-priority CTAs

Good examples:

- `Go to Build: 2 modules still need lessons`
- `Go to Build: lesson descriptions still need work`
- `Go to Preview: structure is complete enough to validate flow`

Bad examples:

- `Build`, `Preview`, `Publish`, and `Share` all styled like equals
- generic `Continue`
- a checklist disguised as one card

## State Variants

The screen should behave differently depending on course state.

### 1. Empty Draft

Meaning:

- new course
- no modules yet

What should dominate:

- short basics
- empty structure state
- next step pushes to `Build`

Good message:

- `Go to Build: create the first module`

### 2. In-Progress Draft

Meaning:

- some structure exists
- course is not yet ready enough for confident validation

What should dominate:

- readiness summary
- top missing pieces
- next step pushes to `Build`

Good message:

- `Go to Build: 2 modules still need lessons`

### 3. Preview-Ready Draft

Meaning:

- basics are present
- structure is coherent enough for creator validation

What should dominate:

- reasoned `Preview` recommendation
- readiness block stays small and non-blocking

Good message:

- `Go to Preview: structure is complete enough to validate flow`

### 4. Published, No Unpublished Changes

Meaning:

- live learner-facing version exists
- draft does not differ materially from it

What should dominate:

- stable lifecycle clarity
- no forced “fix now” tone
- no artificial urgency if the course is already in a good state

Good messages:

- `Published`
- `No unpublished changes`
- `Current learners stay on the published version`

Important rule:

- do not invent a strong next action when the honest state is stability

### 5. Published with Unpublished Draft Changes

Meaning:

- live version exists
- creator has newer private edits in draft

What should dominate:

- draft-vs-published delta
- privacy of unpublished changes
- learner impact of a future publish

Good messages:

- `Draft changes are private until you publish`
- `Current learners stay on the published version`
- `New learners receive the latest published version after publish`

### 6. Archived

Meaning:

- course is no longer in active distribution

What should dominate:

- archived clarity
- reduced action pressure

Good message:

- `Archived courses are no longer actively distributed`

Important rule:

- do not present active authoring or distribution cues as if the course were still live by default

## Messaging Rules

### Lifecycle Messaging

Use direct, low-ambiguity language.

Preferred patterns:

- `Draft changes are private until you publish`
- `Publishing creates a new learner-facing version`
- `Current learners stay on the version they already started`
- `New learners receive the latest published version`
- `No unpublished changes`

Avoid:

- vague labels with no explanation
- generic publish wording without learner impact

### Readiness Messaging

Readiness items should be:

- short
- specific
- action-oriented

Preferred patterns:

- `2 modules still need lessons`
- `4 lessons are missing descriptions`
- `1 prerequisite issue needs review`

Avoid:

- abstract quality labels
- long narrative explanations

### Next Step Messaging

The `Next step` card must be:

- singular
- reasoned
- believable

Preferred patterns:

- `Go to Build: 2 modules still need lessons`
- `Go to Build: content quality still needs work`
- `Go to Preview: structure is complete enough to validate flow`

Avoid:

- unexplained route recommendations
- “magic” recommendations with no visible reason

## Thresholds and Compression Rules

### Readiness Summary

- show at most `4` items
- prioritize severity over completeness

### Lifecycle Strip

- keep to roughly `2-3` chips plus one short hint
- if additional state exists, compress it into one delta message rather than extra chrome

### Structure Summary

- show full short list for small courses
- begin truncation or `show more` after roughly `5-6` modules
- keep issue-first ordering when the list is long

### Resume Signal

For returning creators, a small recency cue is justified.

Preferred examples:

- `Last updated ...`
- `Changed since your last visit`

This should remain supporting information, not a new top-level surface.

## CTA Rules

### Primary CTA

The page has one dominant CTA only.

It should route to:

- `Build`
- or `Preview`

based on the strongest current need.

### Secondary Actions

Secondary actions may exist in the surrounding shell, but they must not compete with the `Next step` card on the page itself.

That means:

- `Publish` does not become the primary action of `Overview`
- `Share` and `Settings` remain tertiary

## What Must Stay Out of `Overview`

Do not move these concerns into `Overview`:

- canvas authoring
- per-lesson editing
- lesson-block editing
- full management dashboard behavior
- full share/settings/publish flows
- a second navigation tree

## Scenario Walkthroughs

### Scenario A: First-Time Creator

Expected scan:

1. see `Draft`
2. confirm basics
3. see no structure yet
4. follow `Go to Build: create the first module`

### Scenario B: Returning Creator on a Half-Built Draft

Expected scan:

1. see `Draft`
2. see readiness issues first
3. see module summary
4. follow `Go to Build: 2 modules still need lessons`

### Scenario C: Returning Creator on a Near-Ready Draft

Expected scan:

1. see `Draft`
2. see that top blockers are minimal
3. understand the draft is coherent enough for validation
4. follow `Go to Preview: structure is complete enough to validate flow`

### Scenario D: Published Course with New Draft Changes

Expected scan:

1. see `Published`
2. see `Draft changes are private until you publish`
3. see learner-impact hint
4. continue to `Build` or `Preview` depending on the current goal

### Scenario E: Large Mature Course

Expected scan:

1. see lifecycle state
2. see top readiness issues first
3. see summary-first structure block, not a giant module dump
4. use `Build` for fixes or `Preview` for validation

## Final Rule

The strongest version of `Overview v2` is not the one with the most information.
It is the one that compresses the right information.

The target experience is:

- fast to scan
- honest about readiness
- clear about draft vs published state
- opinionated about the next step
- still clearly separate from `Build`, `Preview`, and management surfaces
