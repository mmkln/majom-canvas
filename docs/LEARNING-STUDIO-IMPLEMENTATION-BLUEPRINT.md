# Learning Studio Implementation Blueprint

## Status

- State: planning-only, implementation paused
- Updated: 2026-03-27
- Audience: AI implementation agents + human reviewers
- Goal: provide enough context for an AI agent to start implementation with minimal ambiguity
- UX authority for creator flow: `docs/LEARNING-STUDIO-AUTHOR-UX-SPEC.md`
- Publication/access/versioning authority: `docs/LEARNING-STUDIO-PUBLICATION-ACCESS-VERSIONING-SPEC.md`
- Progress/assessment authority: `docs/LEARNING-STUDIO-PROGRESS-ASSESSMENT-SPEC.md`
- Preview/runtime authority: `docs/LEARNING-STUDIO-PREVIEW-LEARNER-RUNTIME-SPEC.md`
- Build interaction authority: `docs/LEARNING-STUDIO-BUILD-INTERACTION-SPEC.md`
- Learner UX authority: `docs/LEARNING-STUDIO-LEARNER-UX-SPEC.md`
- Structured lesson format authority: `docs/LEARNING-STUDIO-STRUCTURED-LESSON-FORMAT-SPEC.md`
- Core-canvas/migration authority: `docs/LEARNING-STUDIO-CORE-CANVAS-MIGRATION-STRATEGY.md`
- Restart-plan authority: `docs/LEARNING-STUDIO-IMPLEMENTATION-RESTART-PLAN.md`

---

## 1) Why this document exists

This blueprint consolidates product and architecture decisions discussed so far into one implementation-ready source.

The current decision is:

- do **not** implement production backend flows yet,
- prepare a detailed plan that an AI agent can execute incrementally,
- allow implementation details to be уточнені during delivery.

---

## 2) Product framing and principles

### 2.1 Product position

`Learning Studio` is a learning module inside the same ecosystem as planning/execution.

It is **not** an isolated LMS clone.

### 2.2 Architectural direction

- Keep learning integrated with planning and task execution.
- Use modular boundaries so learning can evolve independently.
- Start with a local-first prototype (browser storage only) for fast iteration.
- Use dedicated learning entities as the canonical course model from the start of the module work.
- Treat `Goal`, `Story`, and `Task` as visual precedents or projection targets, not as the stored course-domain entities.

### 2.3 UX direction

- **Canvas-first**, but **not canvas-only**.
- Provide dedicated learner-focused views where dense canvas editing is not ideal.
- Keep a shared visual language with current workspace UI.
- Reuse current canvas interaction patterns without collapsing the learning domain into planning entities.

Implementation rule:

- `Home` is a non-canvas entry view.
- `Authoring` is a canvas-centered view with inspector panels, drawers, sheets, or modals for editing.
- `Learner` keeps the course map visible but uses a larger lesson focus panel or split view for consumption.
- access, publishing, enrollment, and settings flows should remain non-canvas.
- on mobile, large side panels may become full-screen sheets.

### 2.4 Authoring direction

Course creation must support both:

1. AI-assisted creation (`Create with AI`)
2. Manual creation (`Create from scratch`)

AI is an accelerator, not a mandatory gate.

### 2.5 Platform strategy

Near-term:

- keep learning as a module in the current app shell.

Long-term option:

- split into an independent product only after clear usage/market validation and stable integration contracts.

---

## 3) Scope and rollout strategy

## Stage A — Documentation & alignment (current)

- Finalize implementation blueprint (this doc).
- Capture decisions, risks, and open questions.
- Avoid code changes except docs.

## Stage B — Local prototype (no backend)

- Implement Learning Studio module behind existing workspace shell.
- Persist all data in browser `localStorage`.
- Support primary flows for creator + learner simulation.

## Stage C — Structured prototype hardening

- Stabilize data contracts and UI states.
- Add migration-safe local schema versioning.
- Add event telemetry abstraction (even if stored locally).

## Stage D — Backend-enabled MVP

- Replace local storage with API-backed persistence.
- Add real access control and enrollment flows.
- Keep backward-compatible migration path.

---

## 4) Functional requirements (local prototype)

## 4.1 Must-have outcomes

1. Creator can create a course.
2. Creator can add and edit structure (modules/lessons/exercises/checkpoints).
3. Creator can grant/revoke learner access (simulated local model).
4. Learner can open an assigned course and mark progress.
5. Progress is visible and persisted locally.

## 4.2 Required capabilities

### Course lifecycle

- create course (manual)
- create course with AI seed prompt (optional in first local pass)
- edit metadata (title, audience, outcomes, duration)
- publish/unpublish (state only)
- archive/delete

### Course structure

- add/remove/reorder modules
- add/remove/reorder lessons
- add/remove/reorder exercises/checkpoints
- mark prerequisites (v1 minimal: list of ids)

### Learner progression

- states: locked / available / in_progress / completed / review
- simple completion actions (manual checkbox first)
- basic completion summary by course/module

### Access model (local simulation)

- `grantAccess(courseId, learnerRef)`
- `revokeAccess(courseId, learnerRef)`
- list learners by course

### AI interaction (prototype-safe)

- optional: generate draft outline from prompt
- optional: suggest next step for learner
- always keep manual override/edit available

---

## 5) UX blueprint

Important constraint:

- use `docs/LEARNING-STUDIO-AUTHOR-UX-SPEC.md` as the canonical reference for creator-facing screen hierarchy, CTA placement, and the `Learn` vs `Preview` decision.

## 5.1 Workspace navigation

Learning Studio should be accessible from the same workspace switcher area as canvas/kanban (shared ecosystem entry).

But it should remain a separate module view, not merged into canvas-board list semantics.

## 5.2 Primary screens

### A. Courses Home

- tabs/segments: `Created by me`, `Enrolled`, `Drafts`, `Published`
- actions: `Create with AI`, `Create manually`
- quick stats: in progress, completed, overdue review
- non-canvas list/grid presentation

### B. Course Authoring View

- split layout:
  - left: structure tree / outline
  - center: canvas map of module → lesson → exercise
  - right: metadata + AI helper panel
- author actions: add, reorder, duplicate, delete, publish
- editing should happen through drawers, sheets, inspectors, or modals over the canvas rather than separate route-heavy page flows

### C. Preview / Learner Focus View

- course map remains available for orientation
- current step
- next recommended action
- lesson content + exercise instructions
- minimal distraction mode compared to authoring canvas
- lesson consumption should use a large focus panel or split view, not a narrow drawer

Creator-facing clarification:

- in the author IA, this screen should be labeled `Preview`
- internal route names may temporarily remain `learn` during transition

### D. Access & Enrollment Panel

- local learner references
- grant/revoke actions
- course visibility state (private / shared / published placeholder)
- non-canvas administrative flow

### E. Progress Panel

- percent by course/module
- completed vs remaining units
- review-needed indicator

## 5.3 Representation principles

- reuse current visual vocabulary where possible
- express learning semantics with badges/metadata before inventing many new shapes
- support both author and learner mode over one underlying domain model

---

## 6) Domain model blueprint

Important clarification:

- `Course`, `CourseModule`, `Lesson`, `Exercise`, and related learning types are the source of truth inside `learning-studio`.
- References to `Goal`, `Story`, and `Task` elsewhere in the docs should be read as visual analogies, implementation precedents, or optional projections into planning/execution flows.
- They should not be used as the canonical stored model for course authoring on the learning canvas.

## 6.1 Canonical entities (target)

- `LearningProgram`
- `LearningPath`
- `Course`
- `CourseModule`
- `Lesson`
- `Exercise`
- `Checkpoint`
- `Enrollment`
- `CourseAccessGrant`
- `LearnerProgress`
- `LearningSession`

## 6.2 Local prototype data contract (v1)

```ts
export type LearningStudioLocalStateV1 = {
  version: 1;
  courses: Course[];
  enrollments: Enrollment[];
  accessGrants: CourseAccessGrant[];
  learnerProgress: LearnerProgress[];
  learningSessions: LearningSession[];
  updatedAt: string;
};

export type Course = {
  id: string;
  title: string;
  description?: string;
  audience?: string;
  outcomes?: string[];
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  moduleIds: string[];
};

export type CourseModule = {
  id: string;
  courseId: string;
  title: string;
  order: number;
  lessonIds: string[];
};

export type Lesson = {
  id: string;
  moduleId: string;
  title: string;
  order: number;
  type: 'lesson' | 'exercise' | 'checkpoint';
  prerequisiteIds: string[];
};
```

## 6.3 Persistence keys (local)

- `learning-studio-state-v1`
- `learning-studio-ui-state-v1`

## 6.4 Migration approach

- include `version`
- add `migrations: Record<number, (prev) => next>`
- on unknown/failing payload: fail-safe reset with backup snapshot key

---

## 7) Event and telemetry blueprint (local-first)

Even without backend, keep typed events to reduce rewrite later.

### Core events

- `learning_course_created`
- `learning_course_published`
- `learning_access_granted`
- `learning_access_revoked`
- `learning_lesson_started`
- `learning_lesson_completed`
- `learning_checkpoint_completed`
- `learning_next_step_requested`
- `learning_ai_suggestion_applied`

### Local event sink (prototype)

- keep in memory + optionally append to local storage event log
- expose helper for future backend ingestion adapter

---

## 8) Integration boundaries in current codebase (expected)

When implementation resumes, likely touchpoints are:

- shell/workspace module registration and switching
- workspace control labels and icons
- i18n strings (EN + UK)
- feature-local module under `src/features/learning-studio/*`

No backend data-access services should be added in local prototype phase.

---

## 9) Implementation roadmap for AI agent

## Iteration 1 — Skeleton

- create module shell and mount/unmount lifecycle
- create routes/views for home + authoring + learner
- read/write empty local state

**Definition of done**

- module opens and closes reliably
- no backend calls
- state survives page refresh

## Iteration 2 — Authoring core

- create/edit/delete course
- add/edit/delete/reorder modules and lessons
- publish/unpublish state

**Definition of done**

- creator can build a complete small course manually

## Iteration 3 — Learner flow

- enrollment/access simulation
- learner mode and step progression
- progress summary

**Definition of done**

- learner can complete a full course path locally

## Iteration 4 — AI assist hooks (optional early)

- non-blocking AI suggestion entry points
- manual override for every AI-produced change

**Definition of done**

- AI can accelerate, but never blocks manual editing

## Iteration 5 — Hardening

- schema migrations
- empty/error/recovery states
- smoke tests on key flows

---

## 10) Acceptance criteria checklist

- [ ] Module available in workspace navigation.
- [ ] Manual course creation works fully.
- [ ] AI-assisted creation entry exists (or explicit TODO if deferred).
- [ ] Learner access grant/revoke simulated locally.
- [ ] Lesson progression persisted locally after refresh.
- [ ] No backend dependency required.
- [ ] Copy localized in EN and UK.
- [ ] Core states handled: empty/loading/error/retry.

---

## 11) Risks and guardrails

## Risks

- scope explosion into full LMS too early
- overfitting to planning entities as permanent source of truth
- UX overload if learner and author complexity are mixed in one dense screen

## Guardrails

- prefer staged delivery
- keep domain model explicit and versioned
- keep manual authoring first-class even with AI features
- keep integration with planning, but preserve module boundaries

---

## 12) Open questions to confirm during implementation

1. Any post-v1 segment expansion beyond creator-led courses with invited learners?
2. Sync policy with planning tasks: all lessons vs active next steps only?
3. AI trust policy: review-before-publish mandatory or optional?
4. How minimal should the first structured lesson editor be before it becomes too limiting?
5. Which telemetry and success events matter enough to capture in the local prototype?

---

## 13) Ready-to-use task prompt template for AI agent

Use this prompt when starting implementation:

> Implement Learning Studio as a local-only prototype module in the existing workspace shell.
> Do not use backend APIs.
> Persist state in browser localStorage with schema versioning.
> Support both manual course creation and AI-assisted entry points.
> Provide separate author and learner presentation modes over a shared domain model.
> Keep i18n in EN and UK.
> Follow staged delivery and stop after the requested iteration.
