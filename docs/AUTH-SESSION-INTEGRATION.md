# Central Browser Sign-In

Majom is an OpenID Connect relying party through `platform-django`. The SPA
never receives the provider's access, refresh, or ID tokens. The backend handles
the authorization-code exchange and creates a regular Django session whose
cookie is HttpOnly.

## Ownership

- `BootOrchestrator` is the single owner of startup session validation and the
  landing/loading/workspace state transition.
- `AuthService` owns the typed token-session contract: callback-code exchange,
  in-memory access token, persisted refresh token, and current identity.
- `HttpInterceptorClient` owns Bearer transport and one refresh-and-retry for an
  expired access token.
- `authFlowService` remains the feature-to-bootstrap request channel for login
  and logout. Features do not implement token refresh or session recovery.

## Required backend endpoints

- `GET /auth/sso/login/?flow=token&return_to=<allowed-frontend>` starts the OIDC redirect.
- `GET /auth/sso/callback/` returns a short-lived single-use `#sso_code` to the frontend.
- `POST /auth/sso/exchange/` returns `{user, access, refresh}`.
- `POST /auth/token/refresh/` refreshes the application access token.
- `GET /auth/sso/me/` returns the authenticated identity for a Bearer token.
- `POST /auth/token/blacklist/` revokes the refresh token during logout.

## Startup contract

The early guard in `src/index.html` always marks auth restore as pending. The
public landing must remain hidden until `AuthService.restoreSession()` either
exchanges `#sso_code` or refreshes the persisted application refresh token. A
failed refresh transitions to the landing without an error toast.

## Security invariants

- Never expose the identity-provider access, refresh, or ID tokens to the SPA.
- Keep the application access token in memory; persist only the application
  refresh token needed to restore a session after reload.
- Send `Authorization: Bearer <access>` for protected API calls; do not depend
  on cross-site cookies or CSRF for JWT-authenticated mutations.
- Redirect to OIDC for login; do not collect the central password in this SPA.
- On `401`, `HttpInterceptorClient` refreshes once and retries the original
  request once; a failed refresh clears the session and notifies `BootOrchestrator`.
- Do not edit `src/features/canvas-core` for auth integration.

## Verification

Run the focused auth/boot tests and a Vite build:

```powershell
npm test -- --run src/majom-wrapper/data-access/auth-service.test.ts src/bootstrap/AuthRestoreGuard.test.ts src/bootstrap/BootStateMachine.test.ts
npm run build:dev
```
