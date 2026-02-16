# Security Posture Notes

## Bearer-token API mode

- The API authenticates with `Authorization: Bearer <token>` headers.
- In this mode, browsers do not automatically attach bearer credentials, so classic cookie-based CSRF risk is reduced.

## Cookie-auth guardrail

- Server-side request security checks now enforce an explicit guard:
  - For state-changing methods (`POST`, `PUT`, `PATCH`, `DELETE`), if a request includes cookies, it must also include `X-CSRF-Token`.
  - Missing `X-CSRF-Token` for cookie-authenticated mutating requests returns `403`.

This keeps bearer mode unchanged while preventing accidental migration to cookie auth without CSRF protection.
