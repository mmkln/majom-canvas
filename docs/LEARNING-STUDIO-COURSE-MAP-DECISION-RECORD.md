# Learning Studio Course Map Decision Record

## Status

- State: decision record
- Updated: 2026-03-28
- Scope: the product role of the course map, its relationship to authoring, and which learner-facing elements belong on it
- Canonical parent doc: `docs/LEARNING-STUDIO.md`
- Related docs:
  - `docs/LEARNING-STUDIO-STRATEGY-RESET.md`
  - `docs/LEARNING-STUDIO-AUTHOR-UX-SPEC.md`
  - `docs/LEARNING-STUDIO-BUILD-INTERACTION-SPEC.md`
  - `docs/LEARNING-STUDIO-PREVIEW-LEARNER-RUNTIME-SPEC.md`
  - `docs/LEARNING-STUDIO-LEARNER-UX-SPEC.md`
  - `docs/LEARNING-STUDIO-PROGRESS-ASSESSMENT-SPEC.md`
  - `docs/LEARNING-STUDIO-STRUCTURED-LESSON-FORMAT-SPEC.md`
  - `docs/LEARNING-STUDIO-CORE-CANVAS-MIGRATION-STRATEGY.md`

## Why this document exists

After the strategy reset, one broad decision became clear:

- the canvas should no longer be the primary authoring surface

But that left a second, more specific problem to resolve:

- what exactly the course map is
- whether every course needs a map
- whether the map is editable
- which learning units belong on the map
- whether map interactions should be route-backed or modal-backed

This document resolves those questions into one coherent model.

## Core Product Realization

The product has three different jobs that must not collapse into one surface:

1. Create and edit the course
2. Validate the learner-facing path through the course
3. Let the learner navigate and consume the course

Those jobs must stay distinct.

## Final Decision Summary

### 1. `Build` is the canonical authoring surface

`Build` owns:

- modules
- lessons
- exercises
- checkpoints
- order
- prerequisite rules
- lesson content
- authoring metadata

`Build` is the place where course truth is created and edited.

### 2. The course map is not a second authoring surface

The course map must not become:

- a peer editor beside `Build`
- a second source of truth for course structure
- a second place to edit learner progression rules

The map is a learner-facing or preview-facing interpretation of already created course data.

### 3. The course map is optional, not mandatory

Every course needs a structure.
Not every course needs a rich, manually composed map.

This means:

- a simple linear course may use a compact, minimized, or auto-generated map
- a branching or prerequisite-heavy course may rely on the map much more heavily
- creators should never be blocked on “building the map” before the course can exist

### 4. The map belongs primarily to `Preview` and learner runtime

The map is strongest when the job is:

- learner orientation
- branch understanding
- blocked vs available clarity
- progress visibility
- next-path understanding

That makes it a natural fit for:

- creator `Preview`
- real learner runtime

It is not the primary tool for:

- repeated content authoring
- dense metadata editing
- rapid structural creation

### 5. Real course work happens in focused runtime routes

The learner may inspect nodes from the map, but actual lesson and unit consumption must happen in focused runtime routes.

This means:

- quick preview on the map is allowed
- real lesson, exercise, and checkpoint work should not happen inside a map modal
- completion, resume, deep-link, reload, and browser history should all be route-backed

## Product Model

### Creator flow

Recommended creator flow:

- `Home`
- `Overview`
- `Build`
- `Preview`

This should remain the primary creator IA.

There should not be a fifth primary creator destination called `Map`.

### Learner flow

Recommended learner flow:

- learner course library
- course home or resume surface
- focused lesson or unit runtime
- completion or review

The map may appear in the learner experience where it improves understanding.

## Source of Truth Model

Canonical course truth should include only:

- course structure
- unit hierarchy
- order
- prerequisite rules
- lesson content
- draft authoring content
- published course versions
- learner progress scoped to published versions

The map layer may own only presentation-oriented concerns:

- map layout metadata
- pan and zoom state
- local map selection
- quick preview UI state
- renderer-specific styling or arrangement metadata

Critical rule:

- map positions and map layout must never become the source of truth for course structure

## Should the creator manually build the map?

Default answer:

- no

The system should be able to derive a map from canonical course structure and prerequisite rules.

Manual map tuning should be treated as:

- optional
- presentation-only
- useful mostly for branching or prerequisite-heavy courses

Manual map tuning should not be required to create or publish a basic course.

## What the map should answer for the learner

The map exists to help the learner answer a small set of questions:

- Where am I?
- What can I open?
- What is blocked?
- What should I do next?
- What have I already completed?
- Where can I branch or review?

If an element does not help answer one of those questions, it usually should not be a first-class map node.

## Map-Worthiness Test

An element should become a first-class learner-map node only if it passes this test:

1. Does showing it materially help the learner understand path, blocking, or progress?
2. Does it have meaningful learner-facing state of its own?
3. Can it be opened, resumed, reviewed, or blocked in a way the learner should explicitly see?
4. Does it improve clarity more than it increases graph noise?
5. Does it preserve, rather than weaken, the product rule of one dominant next step?

If the answer is mostly “no”, the element should stay inside the parent runtime or preview surface instead of becoming a separate map node.

## Default Map Elements

### `Lesson`

Recommended default:

- always include

Reason:

- lesson is the primary learning unit
- lesson is the main object of learner progression, resume, review, and focused runtime

### `Module`

Recommended default:

- include when it improves orientation
- otherwise it may act as grouping, container, or lightweight header

Reason:

- module helps learners understand phase boundaries and progress grouping
- but module is not itself the main unit of learner action

### `Exercise`

Recommended default:

- do not show as a first-class map node by default in simple courses
- promote only when it materially changes navigation or gating

Good reasons to promote:

- it is independently openable and important
- it is the first incomplete required child item
- it acts as a visible learner gate
- it helps explain a branch or blocked state

Otherwise:

- keep it visible inside lesson runtime or lesson quick preview

### `Checkpoint`

Recommended default:

- promote more readily than `Exercise`

Reason:

- checkpoint has stronger gate semantics
- checkpoint often helps explain path blocking or readiness confirmation

But it should still remain subordinate to lesson structure unless it materially improves map clarity.

### `Micro task`

Recommended default:

- do not show on the learner map

Reason:

- micro-tasks are too small and too numerous
- they weaken next-step clarity
- they belong inside lesson content or lesson-local tasking

### `Reference` or `Resource`

Recommended default:

- do not show as first-class map nodes

Reason:

- resources support learning
- they do not usually define progression
- they belong inside lesson content or side panels

## Child Practice Under Lessons

The current v1 model is lesson-centric:

- lessons are the main nodes
- exercises and checkpoints are child progression units under lessons

This remains the safest default.

The learner map should not flatten all child practice into peer lesson nodes by default.

That creates:

- visual noise
- weaker hierarchy
- poorer next-step clarity

## Module-Level Practice, Labs, Projects, and Capstones

There is one important exception to lesson-attached practice:

- module-wide synthesis work

If a practice unit represents a real capstone or module-end synthesis step, it may be better represented as module-level rather than lesson-level.

This is appropriate only when:

- the work spans multiple lessons
- it is not honestly owned by one lesson
- it acts as a module-level gate or culmination

In the current v1 model, there is not yet a first-class dedicated `capstone` or `project` unit type.

Therefore the safest current fallback is:

- represent module-level synthesis through an existing learner-facing unit such as a final lesson or stronger checkpoint-like step

Do not attach one shared practice unit to many lessons at once.

That creates:

- ambiguous ownership
- unclear completion semantics
- many-to-many graph noise
- broken or confusing next-step logic

## Simple vs Branching Course Rules

### Simple mostly-linear course

Recommended map behavior:

- map is visible but secondary
- map may be compact, minimized, or auto-generated
- `Start next lesson` or `Resume lesson` remains dominant
- lessons remain the main visible nodes
- exercises and checkpoints usually stay inside lesson runtime or quick preview

### Branching or prerequisite-heavy course

Recommended map behavior:

- map may become the primary navigation shell
- blocked, available, in-progress, completed, and review states must be very legible
- prerequisite visibility matters more
- selective promotion of checkpoints or important child units becomes more useful

Even in branching courses:

- the learner should still see one dominant recommended next step

The map should help with choice, not force the learner to manually solve the graph.

## Quick Preview on the Map

Quick preview is allowed and useful, but only under strict rules.

Recommended rule:

- quick preview is optional
- quick preview is read-only
- quick preview is for inspection, not for doing real unit work

Quick preview is useful when the learner wants to:

- inspect an upcoming lesson
- compare nearby branch options
- understand why a node is blocked
- review a completed lesson before reopening it

Quick preview should not:

- replace the focused runtime route
- write progress
- become a second lesson runtime
- become a mandatory step before the recommended next action

Recommended surface:

- desktop: stable side panel
- mobile: bottom sheet or full-screen sheet

Avoid:

- hover-only popovers
- narrow drawers as primary learner surfaces
- history state tied to transient map inspection

## Runtime Boundary

Real unit consumption belongs in focused runtime routes.

That includes:

- full lesson reading
- exercise interaction
- checkpoint interaction
- completion actions
- resume behavior
- deep-linking
- reload safety
- browser back and forward

The map is for:

- orientation
- inspection
- path understanding
- lightweight quick preview

The runtime route is for:

- actual learning work

## Progress Semantics the map must respect

The map must remain consistent with the progress model.

Important rules:

- a lesson is not truly complete until required child exercises and checkpoints are completed
- exercises and checkpoints are real progression units, not decorative labels
- `review` must not revoke downstream unlocks
- blocked states must explain the unmet prerequisite explicitly
- the learner should always receive one dominant next-step recommendation

This means the map must not visualize state in a way that implies:

- false completion
- meaningless optionality
- hidden prerequisite logic
- many equally important next actions

## What the creator should edit in `Build`

`Build` remains responsible for:

- module and lesson structure
- child practice existence
- ordering
- lesson block content
- references to required child units
- prerequisite logic
- unit metadata such as objective, description, and estimated duration

Those fields are important because they directly feed:

- runtime next-step logic
- quick preview summaries
- blocked-state explanations
- map readability in `Preview`

## What belongs to `Preview`

`Preview` is the creator-facing validation surface.

It should answer:

- does the learner path make sense
- is the map readable
- are blocked states understandable
- are branching and prerequisites clear
- does the recommended next step feel trustworthy

`Preview` may use the map prominently.
But it must remain:

- validation
- not authoring

## What should not happen

The product should avoid these failure modes:

- the map becoming a second editor
- `Build` and `Map` becoming two sources of truth
- map layout drifting away from canonical structure
- learner runtime reading draft-only map state
- progress being computed against presentation metadata
- quick preview becoming a hidden second runtime
- map complexity overwhelming next-step clarity
- many small child nodes flattening lesson hierarchy

## Documentation contradictions and cleanup needs

One important problem remains in the current doc set:

- older implementation documents still contain canvas-centered authoring language
- newer canonical reset docs explicitly reject that direction

When implementation work resumes, older implementation docs should be synchronized with the reset rules in:

- `docs/LEARNING-STUDIO.md`
- `docs/LEARNING-STUDIO-STRATEGY-RESET.md`
- `docs/LEARNING-STUDIO-AUTHOR-UX-SPEC.md`
- `docs/LEARNING-STUDIO-BUILD-INTERACTION-SPEC.md`
- `docs/LEARNING-STUDIO-PREVIEW-LEARNER-RUNTIME-SPEC.md`

## Final Rule

The shortest correct statement is:

- `Build` owns authoring truth
- `Preview` and learner runtime own map-based interpretation of that truth
- the map is optional and derived for simple courses
- the map becomes stronger only when it genuinely improves learner understanding
