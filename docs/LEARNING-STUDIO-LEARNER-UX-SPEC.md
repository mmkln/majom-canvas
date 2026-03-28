# Learning Studio Learner UX Spec

## Status

- State: decision draft
- Updated: 2026-03-27
- Scope: learner-facing journey, screen hierarchy, and runtime interaction model
- Related docs:
  - `docs/LEARNING-STUDIO.md`
  - `docs/LEARNING-STUDIO-IMPLEMENTATION-BLUEPRINT.md`
  - `docs/LEARNING-STUDIO-PREVIEW-LEARNER-RUNTIME-SPEC.md`
  - `docs/LEARNING-STUDIO-PROGRESS-ASSESSMENT-SPEC.md`
  - `docs/LEARNING-STUDIO-PUBLICATION-ACCESS-VERSIONING-SPEC.md`

## Why this spec exists

The creator flow is now documented in detail, but the real product requirement still depends on a clear learner experience:

- a learner must be able to enter a course
- understand where they are
- know what to do next
- make progress without confusion

Without a dedicated learner UX spec, the product risks over-optimizing for creator workflows and leaving learner consumption as an underspecified afterthought.

## Recommended v1 Target Learner

This spec assumes the v1 target already chosen in publication/access decisions:

- learners consuming creator-led courses through explicit access grants

This means the learner flow is not primarily optimized for:

- open marketplace discovery
- cohort management
- self-authored private learning plans as the first experience

## Core Learner Journey

Recommended v1 learner journey:

1. Enter enrolled course library
2. Open one assigned course
3. Land on a course home or resume surface
4. Start or resume the recommended next lesson
5. Complete lesson work and required child units
6. Continue until course completion

This journey should feel linear and trustworthy even if the underlying course graph becomes more flexible later.

## Core UX Principles

### 1. One dominant next step

The learner should never have to guess what to do next.

### 2. Progress should feel trustworthy

The UI should not imply completion until the product's actual completion rules are satisfied.

### 3. Navigation should support momentum, not inspection

Learners need orientation, but they should not be pushed into creator-style structural thinking.

### 4. Blocked content should be understandable

If something is locked, the learner should understand why.

### 5. Learner UI must exclude creator noise

Publishing, sharing, settings, and authoring controls do not belong in learner runtime.

## Primary Learner Screens

### 1. Enrolled Courses Home

This is the learner's entry surface.

It should show:

- assigned or enrolled courses
- current progress by course
- resume affordance
- recently active courses

Primary CTA:

- `Resume course`

Secondary CTA:

- `Open course`

This screen should not look like the creator's course library.

### 2. Course Home

This is the learner's course-level orientation screen.

It should show:

- course title
- short description
- current progress
- current module or current lesson
- dominant next-step recommendation
- visible but secondary course map or outline

Primary CTA:

- `Start next lesson` or `Resume lesson`

Secondary actions:

- `View full course map`
- `Review completed lessons`

The learner should not land directly into a dense canvas by default.

### 3. Lesson Runtime

This is the main learner work surface.

It should show:

- lesson title
- lesson content
- required child exercises/checkpoints
- current progress context
- one obvious completion path

Primary CTA:

- `Mark lesson complete`

But only when completion rules are satisfied.

If required child work remains incomplete, the dominant action should shift to the first incomplete required unit.

### 4. Course Completion Surface

When the course is complete, the learner should reach a clear end-state.

It should show:

- completion confirmation
- what was completed
- whether review is recommended
- optional recommended next learning path later

This matters because course completion is one of the clearest trust moments in the product.

## Navigation Model

Recommended v1 learner navigation:

- one dominant next step
- visible but secondary course map
- the ability to revisit completed content
- blocked future content still visible when useful

The learner should be able to explore, but the product should always privilege forward momentum.

## Course Map Behavior

The course map should support:

- orientation
- seeing upcoming lessons
- understanding locked vs available vs completed states

The course map should not require the learner to manually plan their own path when the product already knows the recommended next step.

Recommended v1 rule:

- map visible
- next step dominant

## Map Quick Preview

The learner may inspect a node from the course map without immediately leaving the map.

Recommended v1 rule:

- quick preview is optional
- quick preview is read-only
- quick preview must never replace the real lesson runtime

Quick preview is most useful when the learner wants to:

- inspect an upcoming lesson before opening it
- understand why a node is blocked
- compare nearby branch options
- revisit a completed lesson before reopening it

Quick preview is least useful when the learner already wants the recommended next step.

In that case:

- `Start next lesson` or `Resume lesson` should bypass preview and open the focused runtime directly

Recommended interaction:

- selecting a map node may open a stable secondary preview surface
- on desktop, prefer a side panel
- on mobile, prefer a bottom sheet
- do not use hover as the primary trigger
- do not make quick preview the primary click target for opening content

Quick preview should show only:

- unit type
- title
- current state
- blocked reason when relevant
- short description or objective
- estimated duration when available
- module or sequence context
- for lessons, required child work and the first incomplete required child item

Quick preview should end with one clear CTA such as:

- `Start lesson`
- `Resume lesson`
- `Review lesson`
- `Open exercise`
- `Open checkpoint`
- `Go to prerequisite`

Quick preview should not:

- show full lesson content blocks
- allow completion actions
- write learner progress
- become a second lesson runtime inside the map
- compete with the dominant next-step CTA

## Blocked State Rules

If a lesson is blocked, the learner should see:

- that it is blocked
- which prerequisite remains incomplete

Avoid vague labels like only `Locked`.

Preferred messaging:

- `Complete Lesson 2 to unlock this step`

## Resume Behavior

Recommended v1 rule:

- if a learner has one active `in_progress` lesson, `Resume` should return them there
- if nothing is `in_progress`, the product should send them to the recommended next available lesson

The learner should not have to remember where they left off.

Quick preview must not change this rule.

If the learner actually opens a lesson or unit, the product should resume through the focused runtime route.
Transient map selection or quick preview state should not become the learner's persisted resume target.

## Lesson Runtime Layout

Recommended v1 layout:

- top: lesson header and course context
- center: lesson content focus
- side or secondary panel: course map / lesson list / progress summary
- bottom or sticky action zone: dominant next action

This layout may later be powered by a canvas-centered renderer, but the learner-facing interaction must remain focused and readable.

## Content Density Rules

Learner runtime should favor:

- high readability
- low chrome
- minimal management controls
- clear action hierarchy

Learner runtime should avoid:

- creator metadata density
- structural editing controls
- heavy inspector behavior
- admin surfaces

## Completion UX Rules

Recommended v1 behavior:

- a learner may open content freely once available
- required child work must be clearly surfaced before lesson completion
- completion state should be explicit and acknowledged
- completion should naturally advance the learner toward the next step

This should align exactly with the progress semantics spec.

## Review UX Rules

If a completed item enters `review`, the learner should see:

- that the item was completed before
- that review is recommended
- that previously unlocked downstream work remains intact

Review should feel like maintenance, not punishment.

## Relationship to Preview

This spec governs the real learner runtime.

It is intentionally different from creator preview:

- learner runtime uses published content
- learner runtime writes real progress
- learner runtime has learner-only shell context

The exact boundary is defined in:

- `docs/LEARNING-STUDIO-PREVIEW-LEARNER-RUNTIME-SPEC.md`

## What the learner should never see in v1

- publish controls
- access management
- creator settings
- draft-only warnings
- authoring inspector panels
- raw structural metadata meant for the creator only

## Screen-Level Success Criteria

### Enrolled Courses Home is successful when:

- the learner can immediately identify what to resume
- progress across courses is easy to scan

### Course Home is successful when:

- the learner understands where they are in under a few seconds
- the next action is obvious

### Lesson Runtime is successful when:

- the learner can focus on learning without UI noise
- required child work is not accidentally missed
- completion and resume behavior feel reliable

### Course Completion is successful when:

- the learner clearly understands they finished
- the system closes the loop without ambiguity

## Decisions This Spec Resolves

- learner runtime needs its own UX contract, not only a creator preview
- the learner journey starts from enrolled courses, not creator-facing module screens
- learner course entry should orient first and then drive toward one dominant next step
- the course map is secondary to momentum
- learner runtime must be cleaner and less dense than creator `Build`

## Recommended Next Documentation Step

After this spec, the next most useful clarification is:

- `Structured Lesson Format Spec`

That document should define:

- the minimum lesson content structure shared by AI and UI
- how lessons represent required child work
- which block types are allowed in v1
