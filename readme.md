# Auth & Identity Module

Handles user registration, authentication, session management, refresh-token rotation, logout, and authenticated user access.

## APIs

| Method | Endpoint             | Function                                  |
| ------ | -------------------- | ----------------------------------------- |
| POST   | `/api/auth/register` | Register user                             |
| POST   | `/api/auth/login`    | Login and issue access + refresh tokens   |
| POST   | `/api/auth/refresh`  | Rotate refresh token and issue new tokens |
| POST   | `/api/auth/logout`   | Revoke current session and refresh tokens |
| GET    | `/api/users/me`      | Get authenticated user                    |

## Security

* Short-lived JWT access tokens
* Server-side sessions
* Hashed refresh tokens
* Refresh-token rotation
* Token expiry and revocation checks
* Refresh-token replay detection
* Session-based access-token invalidation
* Zod request validation
* bcrypt password hashing

## Architecture

```text
User
 └── Sessions
      └── Refresh Tokens

Access Token → JWT → Session validation
Refresh Token → DB → Rotation + Revocation
```

**Status: Completed**
