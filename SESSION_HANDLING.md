# Session Handling

## Overview

- Sessions are backed by a JWT stored in the `auth-token` HttpOnly cookie.
- The token lifetime is 8 hours and the cookie `maxAge` is aligned to 8 hours.
- Protected routes are guarded by middleware that verifies the JWT.

## Server Endpoints

### `POST /api/auth/login`

- Validates credentials and sets the `auth-token` cookie.
- Response includes `session.expiresAt` in milliseconds since epoch.

### `GET /api/auth/user`

- Returns the authenticated user profile.
- Response includes `session.expiresAt` for the current token.

### `POST /api/auth/refresh`

- Verifies the current cookie token.
- Mints a new JWT with a fresh 8-hour expiry.
- Overwrites the `auth-token` cookie.
- Response includes `session.expiresAt` for the refreshed token.

### `POST /api/auth/logout`

- Clears the `auth-token` cookie.

## Client Behavior

### Session initialization

- On app load, the auth provider calls `/api/auth/user`.
- The provider stores the user and `session.expiresAt` in context state.

### Expiry warning

- A modal appears 5 minutes before `session.expiresAt`.
- The modal shows a live countdown timer.
- Actions:
  - **Refresh Session** calls `/api/auth/refresh` and updates the expiry.
  - **Logout** clears the session and redirects to `/auth/signin`.

### Expiry enforcement

- When the expiry time is reached, the client logs out and redirects.

## Notes

- The warning modal is non-dismissible to ensure an explicit action.
- If refresh fails (network or invalid token), the client logs out.
