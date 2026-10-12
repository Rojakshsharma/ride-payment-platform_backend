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

# Driver & Location Module

Handles driver profile creation, driver availability status, liveness tracking, and real-time driver location management.

## APIs

| Method | Endpoint                 | Function                          |
| ------ | ------------------------ | --------------------------------- |
| POST   | `/api/drivers`           | Create driver profile             |
| PATCH  | `/api/drivers/status`    | Update driver availability status |
| POST   | `/api/drivers/heartbeat` | Maintain driver liveness          |
| PATCH  | `/api/drivers/location`  | Update driver's current location  |

## Driver Status

* `OFFLINE` → Driver is not accepting rides
* `AVAILABLE` → Driver is online and available for rides
* `BUSY` → Driver is currently handling a ride

Drivers can manually switch between `OFFLINE` and `AVAILABLE`.

`BUSY` is controlled by the ride lifecycle and cannot be manually set by the driver.

## Location & Liveness

* Current driver location is stored in Redis GEO
* PostgreSQL stores durable driver/business data
* Redis GEO is used for nearby-driver discovery
* Driver liveness is maintained using a Redis TTL key
* Heartbeat refreshes the driver's liveness TTL
* Location updates include `capturedAt` timestamps
* Older/out-of-order location updates are rejected

## Redis

```text
drivers:locations
└── GEO coordinates
    └── driverId → longitude + latitude

driver:<driverId>:liveness
└── ALIVE
    └── TTL: 60 seconds

driver:<driverId>:location:timestamp
└── Latest capturedAt timestamp
```

## Architecture

```text
Driver App
    │
    ├── Status ──────────────→ PostgreSQL
    │
    ├── Heartbeat ───────────→ Redis TTL
    │
    └── Location ────────────→ Redis GEO
                                  │
                                  ↓
                         Nearby Driver Matching
```

## Security & Validation

* JWT authentication required for all driver APIs
* Driver profile ownership validated using authenticated user ID
* Zod request validation
* Driver status transition validation
* Location latitude/longitude validation
* Stale location updates rejected using `capturedAt`

**Status: Completed**
