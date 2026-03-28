# Learning Studio

## Status

- State: discovery
- Started: 2026-03-23
- Document type: living product and architecture notes
- Implementation planning companion: `docs/LEARNING-STUDIO-IMPLEMENTATION-BLUEPRINT.md`
- Author UX decision spec: `docs/LEARNING-STUDIO-AUTHOR-UX-SPEC.md`
- Publication/access/versioning spec: `docs/LEARNING-STUDIO-PUBLICATION-ACCESS-VERSIONING-SPEC.md`
- Progress/assessment spec: `docs/LEARNING-STUDIO-PROGRESS-ASSESSMENT-SPEC.md`
- Preview/runtime spec: `docs/LEARNING-STUDIO-PREVIEW-LEARNER-RUNTIME-SPEC.md`
- Build interaction spec: `docs/LEARNING-STUDIO-BUILD-INTERACTION-SPEC.md`
- Canvas author journeys: `docs/LEARNING-STUDIO-CANVAS-AUTHOR-JOURNEYS.md`
- Learner UX spec: `docs/LEARNING-STUDIO-LEARNER-UX-SPEC.md`
- Structured lesson format spec: `docs/LEARNING-STUDIO-STRUCTURED-LESSON-FORMAT-SPEC.md`
- Core-canvas/migration spec: `docs/LEARNING-STUDIO-CORE-CANVAS-MIGRATION-STRATEGY.md`
- Implementation restart plan: `docs/LEARNING-STUDIO-IMPLEMENTATION-RESTART-PLAN.md`

This document tracks the current understanding of the planned learning module.
It should be updated as discussions continue and requirements become more concrete.

## Working Name

- Product-facing name: `Learning Studio`
- Technical module id: `learning-studio`
- Planned module class: `LearningStudioModule`

## Decision Summary

- `Learning Studio` is canvas-first.
- The course canvas should use dedicated learning entities such as `Course`, `CourseModule`, `Lesson`, and `Exercise`.
- `Goal`, `Story`, and `Task` are not the canonical course model.
- Existing planning entities may be used as design references, visual precedents, or projection targets into the broader planning and execution system.
- Reusing canvas interaction patterns does not mean reusing planning entities as the source of truth for course data.
- The v1 target segment is creator-led courses shared with explicitly invited learners.
- Real learner runtime is a first-class product concern and is distinct from creator-facing `Preview`.

## Vision

`Learning Studio` is an AI-first learning platform inside Majom Canvas.
It combines course authoring, personalized learning-plan generation, interactive canvas-based learning, and AI guidance during both course creation and course consumption.

## Product Context

`Learning Studio` is not meant to be a disconnected LMS inside the app.
The broader product is a personal development workspace with two primary pillars:

- planning and time management
- learning and guided growth

This matters for the module design.
Learning items should connect to the user's broader execution system instead of living in an isolated course player.
A lesson, exercise, or checkpoint should be able to exist as concrete work inside the same ecosystem as goals, stories, and tasks.
That does not mean courses themselves should be stored as `Goal`, `Story`, and `Task`.

## Product Intent

- Enable creators to generate full courses with AI.
- Enable learners to generate personalized learning plans with AI.
- Deliver learning through an interactive canvas instead of only static lesson pages.
- Let AI help users both design learning content and progress through it.
- Integrate learning progression into the same personal-development workflow as planning and task execution.

## Initial Scope

- AI-generated course outlines
- AI-generated lesson structures
- AI-generated learning plans
- course access for learners
- Interactive canvas learning experience
- AI tutor or copilot support during learning
- Progress support, guidance, and next-step recommendations
- Learning items represented in a way that can connect to the wider task system

## High-Level Capability Map

### 1. Course Authoring

- Create a course from a topic, audience, goal, and duration.
- Generate modules, lessons, exercises, checkpoints, and outcomes.
- Edit generated structure manually on a canvas.
- Refine or regenerate parts of a course without replacing everything.
- grant learners access to a course for consumption

### 2. Learning Plan Generation

- Create a personalized learning path for a learner.
- Adapt the plan to skill level, time budget, and target outcomes.
- Recommend course sequence, milestones, and pacing.

### 3. Interactive Learning

- Present lessons and concepts through a navigable canvas.
- Connect concepts, tasks, exercises, and checkpoints visually.
- Support exploration, progression, and contextual help from the same workspace.

### 4. AI Learning Support

- Answer questions during learning.
- Explain concepts in the context of the current lesson or canvas node.
- Recommend next steps, practice tasks, and review points.
- Help learners recover when they are stuck or off track.

## Relationship To Existing Modules

- `canvas`: likely provides the core interaction model for authoring and learning views.
- `ai-assistant`: likely provides orchestration, planning, generation, and tutoring behaviors.
- `shell`: likely mounts `learning-studio` as a separate workspace module.

## Integration Principle

The most important domain rule identified so far is:

- learning is part of personal development, not a separate island

Practical implications:

- lessons should be able to surface as work items
- learning plans should be able to influence what appears in a user's execution flow
- course progression should be visible alongside non-learning work
- the module should integrate with planning instead of competing with it

## Final Version Definition

The target end-state of `Learning Studio` is a full learning platform integrated into the broader personal-development workspace.

In that end-state, the module should provide:

- AI-generated courses from topic, audience, and target outcome
- AI-generated personalized learning plans
- interactive canvas-based authoring and learning
- learner and creator flows inside the same ecosystem
- lesson, exercise, and checkpoint progression integrated with tasks and planning
- AI tutor guidance during course creation and course completion
- a clear link between long-term growth goals and daily executable learning work

The target product shape is therefore not only a course builder and not only a lesson player.
It is a learning system that plugs directly into the app's planning model.

## Minimum Product Requirement

The first non-negotiable product capability is:

- a creator can create a course
- a creator can grant a learner access to that course
- a learner can enter the platform and consume that course for learning

`Share course` and `grant access to learning` are treated as the same functional requirement for now.
The key product outcome is that a course can move from authoring to learner consumption.

## Product Risk Assessment

The core idea is not stupid.
It is ambitious, but it has a coherent product thesis:

- planning supports personal development
- learning supports personal development
- bringing them together can create a stronger system than keeping them separate

The idea becomes excessive only if all layers are attempted at once.

High-risk overreach would look like:

- building a full LMS
- building a fully adaptive AI tutor
- building a perfect personalized learning planner
- building deep planning-learning integration
- building all of that in one release

That would be too much.

The idea remains strong if it is staged.

Recommended discipline:

- first prove course creation plus learner access
- then prove learning progression inside the existing execution system
- then add stronger AI generation and tutoring
- only after that move toward highly personalized AI-built learning plans

So the risk is not that the concept is foolish.
The real risk is scope collapse.

## Realistic Now Definition

Given the current codebase, the realistic near-term version should be smaller and should reuse the infrastructure that already exists.

The most realistic first deliverable is:

- represent a course on the existing canvas infrastructure using dedicated learning entities
- borrow interaction patterns and visual references from existing planning elements where they already fit
- let AI generate the initial course or learning plan
- let the user edit that structure manually
- let lessons and exercises appear as actionable items that can be tracked through existing progress mechanics
- use the current AI assistant for generation, refinement, and guidance before building a separate deep learning runtime

In practice, that suggests a first increment closer to:

- `Goal` visual patterns can inform how a course objective or broader course entry might appear
- `Story` visual patterns can inform how module-like containers behave on the canvas
- `Task` visual patterns can inform how lesson, exercise, or checkpoint cards behave on the canvas
- learning entities remain distinct from planning entities even when they reuse these visual precedents

This would immediately test the core thesis that learning should feed into execution.

The realistic near-term product slice is therefore:

- create a course structure
- persist it in a way the creator can revisit
- grant learner access
- let the learner progress through lessons and exercises
- optionally surface lesson work as task-like items in the broader execution system

This is much more realistic than starting with fully autonomous personalized course synthesis for every learner.

## Ideal AI-Native Learner Experience

The ideal long-term flow is:

- the learner opens the platform
- the learner tells the AI what they want to learn or master
- the AI understands the learner goal, current level, constraints, and preferences
- the AI uses rich context, strong examples, and structured course knowledge to assemble the best-fit learning plan
- the AI guides the learner through the plan over time and adapts it as progress changes

This is the desired end-state, but it depends on a significantly stronger AI system than the initial version requires.

## AI System Requirements

The ideal experience implies three major requirements:

### 1. Strong Model Capability

- the AI must reason well about learning goals, skill progression, sequencing, and pedagogy
- the AI must be able to synthesize structured outputs, not only chat responses
- the AI must preserve context across a learner journey, not only within a single prompt

### 2. Good Interaction Architecture

- the system needs a clear orchestration layer between UI, learning domain, and model calls
- the AI should work against structured state, not raw free-form prompts alone
- the architecture should separate planning, recommendation, tutoring, and content-generation responsibilities
- the system should support iterative refinement instead of one-shot generation only

### 3. Structured Learning Data

- the platform needs a structured format for courses, lessons, exercises, outcomes, prerequisites, and progress
- the AI should consume and produce typed learning-plan data
- course materials need enough structure to support generation, editing, delivery, and adaptation

Without these three pieces, the AI-native experience will feel unreliable or shallow.

## Access Model

The current product direction assumes a simple access model first:

- creator authors a course
- creator grants learner access
- learner consumes the course

Later versions may add:

- invitations
- cohort access
- role-based permissions
- AI-generated personalized plans on top of shared course material

The important point is that learning distribution is part of the module scope from the beginning, not an afterthought.

## Canvas Representation Principles

The learning canvas should stay visually compatible with the current planning canvas instead of introducing a completely unrelated design language.

Recommended representation rules:

- hierarchy should be visible through scale and containment
- element type should be visible through shape family, icon, and label
- progress should be visible through status styling
- special learning states should be visible through overlays and badges, not through entirely separate element systems
- the same learning elements should support both author mode and learner mode

This keeps the canvas readable while allowing learning-specific meaning to emerge gradually.

## Author Mode And Learner Mode

The same underlying learning elements should support two presentation modes.

### Author Mode

Author mode should emphasize:

- structure
- editing affordances
- metadata density
- prerequisites and sequencing

### Learner Mode

Learner mode should emphasize:

- current step
- next recommended action
- progress clarity
- reduced visual noise

This suggests one shared domain model with two UI presentations rather than two unrelated canvas systems.

## UI Architecture Decision

Author-flow specificity is defined in:

- `docs/LEARNING-STUDIO-AUTHOR-UX-SPEC.md`

The recommended UI architecture is hybrid:

- `Home` should be a non-canvas course list and entry screen.
- `Authoring` should be canvas-first, with editing done through inspector panels, drawers, sheets, or modals layered over the canvas.
- `Learner` should keep the course map visible, but open lesson consumption in a larger focus panel or split view instead of tiny drawers.
- access, publishing, enrollment, and course settings should stay in non-canvas forms or panels.

This means the product should not be implemented as only full pages and should not be implemented as only small overlays on top of the canvas either.

The intended balance is:

- canvas for structure, sequencing, prerequisites, and spatial navigation
- panels or sheets for metadata editing and focused lesson work
- non-canvas screens for administrative flows

On smaller screens, large side panels may collapse into full-screen sheets instead of narrow drawers.

Additional author-flow decisions now fixed:

- the creator-facing primary flow is `Home -> Course Overview -> Build -> Preview`
- `Access`, `Settings`, and `Publish` are secondary management surfaces
- creator-facing `Learn` should be treated as `Preview` in the IA

## Recommended Learning Elements On Canvas

### Course

Recommended default representation:

- in a dedicated learning workspace, the course is the canvas context itself
- in shared planning views, the course can be collapsed into a high-level `Goal`-like element

This avoids cluttering the course workspace with a giant wrapper node while still allowing the course to appear in the broader planning system.

### Module

Recommended representation:

- a `Story`-like container
- large rounded block
- clear title
- module metadata in the header area

Suggested visible metadata:

- module title
- estimated duration
- difficulty level
- progress summary

### Lesson

Recommended representation:

- a `Task`-like card
- medium-sized actionable element
- visually treated as the primary unit of learner progression

Suggested visible metadata:

- lesson title
- estimated duration
- lesson type badge
- completion state

### Exercise

Recommended representation:

- initially a `Task`-like card variant
- slightly stronger accent than a lesson
- intended to read as active practice, not passive study

Suggested visible metadata:

- exercise title
- expected effort
- exercise type
- completion state

### Checkpoint Or Quiz

Recommended representation:

- v1: a stronger `Task`-like variant with a prominent checkpoint badge
- later: a distinct shape such as a diamond or hex variant if checkpoints become first-class enough

This is a good candidate for a more specialized visual form later, but not necessary on day one.

### Resource Or Reference

Recommended representation:

- a slim supporting card or attached note
- visually secondary to lessons and exercises
- linked to the learning node it supports

Examples:

- article
- video
- cheat sheet
- template

### AI Guidance

Recommended representation:

- not a permanent domain node by default
- shown as contextual overlays, suggestions, highlights, or temporary callouts

The AI should feel like a smart layer on top of the course graph, not like noisy structural clutter inside it.

## Suggested Visual Semantics

The canvas should separate three concerns:

- hierarchy
- type
- state

Recommended encoding:

- hierarchy: size and containment
- type: icon, badge, or subtle chroma accent
- state: border/fill treatment and motion

This is important because learning will quickly become unreadable if one visual signal tries to carry all meanings at once.

## Learning State Model

Learning elements likely need more than one kind of state.

At minimum, the model should distinguish:

- content lifecycle state
- learner progress state

Examples of content lifecycle state:

- draft
- published
- archived

Examples of learner progress state:

- locked
- available
- in progress
- completed
- review recommended

The current canvas status model is still useful for early delivery, but the long-term learning system should not overload a single enum to represent both content lifecycle and learner progress.

## Recommended V1 Visual Strategy

The safest first step is:

- reuse the current `Goal`, `Story`, and `Task` visual families
- add learning meaning through labels, badges, icons, and metadata
- avoid introducing many brand-new shape types immediately

Suggested mapping:

- `Goal` visual family for course objective or course entry in the broader planning view
- `Story` visual family for module containers
- `Task` visual family for lessons and exercises

Suggested v1 overlays:

- lock badge for unavailable content
- spark or highlight badge for AI-recommended next step
- review badge for spaced repetition or revisit prompts
- small duration and effort pills

This gives the product a learning feel without forcing a full redesign of the canvas renderer in the first iteration.

## Additional Considerations Often Missed

These are important questions that are easy to postpone too long.

### 1. Who The Product Is For First

Chosen v1 direction:

- creator-led courses shared with explicitly invited learners

This changes the access model, authoring flow, and AI role significantly.

### 2. Course Ownership And Versioning

Focused v1 draft spec:

- `docs/LEARNING-STUDIO-PUBLICATION-ACCESS-VERSIONING-SPEC.md`

- who owns a course
- can a creator edit a course after learners already started it
- do learners stay on the old version or move to the new one
- how are drafts and published versions separated

Without this, learning progress becomes fragile very quickly.

### 3. Publication And Visibility Model

Focused v1 draft spec:

- `docs/LEARNING-STUDIO-PUBLICATION-ACCESS-VERSIONING-SPEC.md`

- what is private
- what is shared by link
- what is shared to specific learners
- what is published as reusable material

Access control is not just a technical detail here; it changes the core product behavior.

### 4. Progress Semantics

Focused v1 draft spec:

- `docs/LEARNING-STUDIO-PROGRESS-ASSESSMENT-SPEC.md`

If this stays fuzzy, progress tracking will feel untrustworthy.

### 5. Planning-Learning Synchronization Rules

- when should a lesson become a task
- should every lesson appear in the main execution system
- should only the active next steps appear
- what happens when a learner falls behind or pauses a course

This is one of the most important integration decisions in the whole product.

### 6. Learner Runtime UX

Focused v1 draft spec:

- `docs/LEARNING-STUDIO-LEARNER-UX-SPEC.md`

The learner runtime must now be treated as a first-class flow, not only as a preview concern.

### 7. Structured Lesson Format

Focused v1 draft spec:

- `docs/LEARNING-STUDIO-STRUCTURED-LESSON-FORMAT-SPEC.md`

This defines the minimum shared content contract between AI generation, authoring UI, preview, and learner runtime.

### 8. Core-Canvas Migration Strategy

Focused v1 draft spec:

- `docs/LEARNING-STUDIO-CORE-CANVAS-MIGRATION-STRATEGY.md`

This defines how the product can stay canvas-first without coupling itself to the current planning-canvas implementation.

### 9. Assessment And Feedback

- do exercises only exist as checkboxes, or as graded activities
- can the AI assess answers
- what counts as passing a checkpoint
- what kind of feedback is stored for later adaptation

Learning products become shallow if they only model content and not evaluation.

### 10. AI Trust, Provenance, And Quality Control

- where does generated course structure come from
- can the creator review and approve AI-generated material before learners see it
- should AI claims or examples include sources
- how will hallucinated or low-quality content be corrected

This matters even more if the AI uses external examples or web knowledge.

### 11. Structured Content Format

- what is the minimal content block model for a lesson
- text only, or text plus examples, tasks, references, and reflection prompts
- how do prerequisites and dependencies get encoded
- how do AI-generated materials round-trip through editing

This is one of the most foundational architecture decisions.

### 12. Success Metrics

- what proves the module is working
- course creation count
- learner activation
- lesson completion
- time to first useful plan
- retention

Without this, it will be hard to know whether the concept is actually helping users.

### 13. Failure Modes

- what happens when the AI gives a weak plan
- what happens when the learner does not know what to ask for
- what happens when the course is too big or too vague
- what happens when the learner stops halfway

Strong products usually handle the failure path as deliberately as the happy path.

## Entity Strategy

The recommended model is:

- final architecture: use dedicated learning entities
- early delivery: allow projection into existing planning entities

This means `goal`, `story`, and `task` should not become the long-term source of truth for course data.
They are useful as an integration layer, but they are too planning-specific to represent the full learning domain cleanly.

### Why New Learning Entities Are Needed

Courses and learning flows will likely need concepts that planning entities do not express well, for example:

- course structure and versioning
- lesson content and content blocks
- exercise and assessment types
- prerequisites between lessons
- per-learner progress and attempts
- personalized learning-path variants
- tutor context and learning-state metadata

If `goal`, `story`, and `task` become the canonical course model, the planning domain and learning domain will collapse into one another and both will become harder to evolve.

### Why Existing Planning Entities Still Matter

The current app architecture already has strong support for `goal`, `story`, and `task` across canvas rendering, persistence, API integration, and AI-assisted workflows.
Because of that, they are a good short-term reference surface for interaction patterns and a good execution projection target for v1.

The practical recommendation is:

- keep learning entities as the future canonical model
- use planning entities as a visual reference, temporary bootstrap aid where absolutely necessary, or a derived execution projection

### Recommended Layering

Layer 1: canonical learning domain

- `Course`
- `CourseModule`
- `Lesson`
- `Exercise`
- `LearningPath`
- `LearnerProgress`
- `CourseAccessGrant`
- `Enrollment`

Layer 2: planning and execution projection

- `Goal` as learning outcome or course objective
- `Story` as module or lesson group
- `Task` as lesson, exercise, review, or study action

### Recommended Rule

- courses should not be stored only as goals, stories, and tasks
- lessons may appear as tasks in the execution system
- planning entities should represent actionable work derived from learning, not the full learning model itself

This gives the product the integration it wants without permanently binding course modeling to planning semantics.

## Recommended Delivery Stages

### Stage 1: Canvas-First Learning Prototype

- AI generates a course outline or learning plan into a canvas-first learning experience.
- Users refine the generated structure manually on the canvas.
- Early iterations may still project lesson or exercise work into task-like execution states where useful.
- Early local passes may simulate learner runtime, but the product contract must already preserve a distinct real learner runtime boundary.

### Stage 2: Dedicated Learning View

- Introduce a separate `learning-studio` workspace module in the shell.
- Reuse canvas infrastructure, but tailor the UX for course authoring and course consumption.
- Add learning-specific metadata, progress rules, and navigation.

### Stage 3: Full Learning Platform

- Add richer tutoring, adaptive progression, assessments, and deeper learner state.
- Support more sophisticated authoring flows and personalized learning journeys.
- Make the planning-learning integration a first-class product loop.

## Early Module Boundary

The planned `learning-studio` module will likely own:

- course structure and learning-path domain models
- authoring flows for AI-generated course creation
- learner flows for consuming and progressing through content
- learning-specific canvas presentation and interactions
- progress tracking and learning recommendations

The module will likely depend on shared or existing capabilities for:

- canvas rendering infrastructure
- AI runtime and model integration
- workspace shell integration
- shared UI library components

## Candidate Domain Objects

- `LearningProgram`
- `LearningPath`
- `Course`
- `CourseModule`
- `Lesson`
- `Exercise`
- `Checkpoint`
- `LearningSession`
- `LearnerProgress`

## Current Architectural Read

Based on the current workspace architecture, the most realistic implementation path is:

- keep using the shell-level module system for a future dedicated learning workspace
- reuse canvas interaction patterns instead of replacing them immediately
- reuse the AI assistant runtime for course generation and tutoring workflows
- keep learning-domain models separate from planning entities even if planning-style visual families or execution projections are reused

This is an inference from the current source layout and runtime contracts, especially the existing workspace modules and AI assistant integration.

There is already a useful split in the current codebase:

- canvas UI elements are relatively generic visual planning elements
- persistence and API layers are more tightly coupled to concrete `Goal`, `Story`, and `Task` backend models

That is another reason to avoid treating planning entities as the permanent course model.

## User Roles

- Course creator
- Learner
- AI copilot or tutor

## Open Product Questions

- Will courses be linear, graph-based, or hybrid?
- How much of the course can AI generate automatically in v1?
- Will a learning plan be separate from a course, or a personalized view over course content?
- At what point does `learning-studio` stop being a view over planning data and become its own runtime and persistence boundary?
- Should lessons always create mirrored execution tasks, or only when the learner commits them into an active plan?
- How much external knowledge and retrieval should the AI use when composing personalized plans?
- Should the first AI-generated plan use only internal course structures, or also synthesize plans directly from open-ended learner intent?
- Which learning events and outcomes will define success for the first release?

## Decision Log

### 2026-03-23

- Chosen working product name: `Learning Studio`
- Chosen technical module id: `learning-studio`
- Chosen planned module class name: `LearningStudioModule`
- The feature is intended to combine AI course generation, AI learning-plan generation, interactive canvas learning, and AI help during learning.
- The broader application thesis is personal development, with planning and learning as the two primary pillars.
- Learning should flow into the shared execution system instead of being isolated from tasks and planning.
- The most realistic first version is a learning workflow built on top of existing canvas and AI assistant capabilities before a full standalone learning runtime is introduced.
- The recommended long-term model is to introduce dedicated learning entities and use `goal/story/task` as an integration or projection layer rather than the canonical course model.
- The first must-have product capability is course creation plus learner access to consume that course.
- The ideal long-term experience is an AI-native learner flow where the user states what they want to learn and the AI composes a personalized plan from structured knowledge and strong contextual understanding.
- Reaching that ideal requires stronger model capability, better AI orchestration, and a structured learning data format.
- The learning canvas should stay compatible with the existing planning visual language.
- The recommended first-step visual model is module-as-container and lesson/exercise-as-card, with type and learning state carried by badges and overlays rather than many brand-new shapes.
- Course context should usually be the canvas itself, while course appearance inside the broader planning space can be represented by a higher-level goal-like node.
- The same learning entities should support an author-facing canvas mode and a learner-facing canvas mode with different information density.
- `Goal`, `Story`, and `Task` should be treated as visual and behavioral references for learning elements, not as the course-domain entities themselves.
- The overall concept is valid; the main product risk is trying to ship too many layers of it at once.
- Several easy-to-miss areas now identified as important: audience focus, publication/versioning, progress semantics, planning-learning sync, assessment, AI trust, structured content format, and success metrics.

## Discussion Notes

### 2026-03-23

- The new feature is envisioned as a platform for courses.
- The experience should include an interactive canvas.
- AI should be able to generate complete courses.
- AI should be able to generate learning plans.
- AI should help users while they are progressing through learning.
- The overall app was conceived for two primary jobs: planning/time management and learning.
- Planning should cover strategic, tactical, and operational levels in one place.
- Learning should plug into that same system because both learning and planning serve personal development.
- A lesson should be able to appear as a concrete task to complete alongside the rest of a user's work.
- A key design question is whether courses should reuse planning entities directly or introduce separate learning entities.
- Current conclusion: separate learning entities are the better long-term model, but reuse of planning entities is realistic for early delivery and execution integration.
- Clarification: "reuse" should usually mean reuse of visual families, interaction patterns, and execution projections, not reuse of planning entities as the canonical stored course model.
- The first concrete capability should be course creation plus the ability to give students access to learn it.
- The ideal version is a strong AI experience where a learner describes what they want to master and the AI builds the most suitable learning plan.
- That ideal requires a genuinely strong AI, a well-designed interaction architecture, and structured learning-plan and material formats.
- We started defining how learning elements could look on the canvas.
- Current recommendation: reuse the existing visual families for v1 and layer learning semantics through containment, badges, icons, and overlays.
- Modules should behave visually like containers, lessons and exercises like cards, and AI guidance like contextual overlays rather than permanent graph nodes.
- The same underlying elements should support a denser author mode and a simpler learner mode.
- A key concern raised in discussion is whether the combined planning-plus-learning product is too much.
- Current conclusion: the concept is coherent, but it must be staged carefully to avoid scope collapse.
- We identified several additional product questions that are easy to overlook early: user segment, course versioning, publication model, progress semantics, assessment model, AI trust, content structure, and success metrics.

## Next Areas To Define

- module runtime boundary
- planning synchronization rules
- AI trust and approval policy
- success metrics and event model
- AI generation workflow
- AI tutoring workflow
