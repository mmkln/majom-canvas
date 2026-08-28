# Central Browser Sign-In

Majom is an OpenID Connect relying party through `platform-django`. The SPA
never receives the provider's access, refresh, or ID tokens. The backend handles
the authorization-code exchange and creates a regular Django session whose
cookie is HttpOnly.

## Ownership

- `BootOrchestrator` is the single owner of startup session validation and the
  landing/loading/workspace state transition.
- `AuthService` owns the typed `/auth/sso/session/` contract and in-memory
  authenticated identity/CSRF state.
- `HttpInterceptorClient` owns browser API transport: `credentials: include`
  on every request and `X-CSRFToken` on mutations.
- `authFlowService` remains the feature-to-bootstrap request channel for login
  and logout. Features do not implement token refresh or session recovery.

## Required backend endpoints

- `GET /auth/sso/login/` starts the OIDC redirect.
- `GET /auth/sso/callback/` exchanges the code and creates the Django session.
- `GET /auth/sso/session/` returns `{authenticated, user, csrfToken}` or `401`.
- `POST /auth/sso/logout/` closes only the local application session.

## Startup contract

An HttpOnly cookie is intentionally unreadable to JavaScript, so the early
guard in `src/index.html` always marks auth restore as pending. The public
landing must remain hidden until `AuthService.restoreSession()` resolves. A
`401` transitions to the landing without an error toast; an invalid or failed
stored session clears in-memory auth and uses the existing session-expired flow.

## Security invariants

- Never store access, refresh, or ID tokens in `localStorage` or
  `sessionStorage`.
- Treat the backend session endpoint as the only browser auth source of truth.
- Keep CSRF enabled for session-authenticated mutations.
- Redirect to OIDC for login; do not collect the central password in this SPA.
- On `401`, clear the in-memory session and notify `BootOrchestrator`; do not
  add a hidden refresh-token retry loop.
- Do not edit `src/features/canvas-core` for auth integration.

## Verification

Run the focused auth/boot tests and a Vite build:

```powershell
npm test -- --run src/majom-wrapper/data-access/auth-service.test.ts src/bootstrap/AuthRestoreGuard.test.ts src/bootstrap/BootStateMachine.test.ts
npm run build:dev
```
