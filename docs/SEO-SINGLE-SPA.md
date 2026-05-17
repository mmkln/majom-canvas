# Single-Entry SPA SEO

## Scope

Use this guide when SEO, AI-search discoverability, public landing content, social previews, or crawler-facing metadata change in the single-entry SPA.

## Constraints

- Keep Majom as a single-page app with one public entry URL.
- Do not add route paths for landing, login, app, features, docs, or use cases inside this project.
- Model public landing, login, loading, and authenticated workspace as internal app states.
- If SEO needs additional indexed material inside this repository, use static files under `src/public/docs/` rather than SPA routes.
- If future SEO needs full multi-page UX, build that as a separate marketing/docs surface outside this SPA.

## Ownership

- `src/index.html` owns crawler-readable root landing content, global metadata, social preview metadata, and structured data.
- `src/bootstrap/PublicLandingPage.ts` owns landing CTA behavior and show/hide lifecycle after JavaScript boots.
- `src/bootstrap/BootOrchestrator.ts` owns transitions between public landing, login, booting, ready, and boot error states.
- `src/public/robots.txt`, `src/public/sitemap.xml`, and `src/public/llms.txt` own crawler and AI-summary entry points.
- `src/public/docs/*.md` owns static crawler-readable product references. These files are public assets, not app routes.

## UI Composition

- Landing UI is still subject to the project-wide UI-lib-first rule.
- Static crawler-readable markup in `src/index.html` may use semantic HTML because it must exist before the SPA runtime loads.
- Any landing UI created, enhanced, or controlled from TypeScript must reuse existing ui-lib/HUD primitives before adding bespoke controls.
- Do not introduce new landing-specific button, input, modal, dropdown, or notification primitives when `src/ui-lib/src` already has a suitable component.

## Required SEO Baseline

- The root URL must expose meaningful product copy without requiring authentication.
- The first unauthenticated state should be the public landing, not the login form.
- Keep canonical URLs on the production domain, currently `https://gomajom.com/`.
- Include title, description, robots, canonical, Open Graph, Twitter card, and JSON-LD metadata.
- Include an `og-image.png` preview asset at 1200x630.
- Keep the sitemap focused on the root URL plus static `src/public/docs/*.md` references. Do not list SPA-internal app states as URLs.

## AI-Search Content Standard

The landing content should directly answer:

- What is Majom?
- Who is Majom for?
- What problem does it solve?
- How is it different from Trello, Miro, or Notion?

Keep the positioning individual-first unless product strategy changes.
