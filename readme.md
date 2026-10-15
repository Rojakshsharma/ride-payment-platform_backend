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
# Payment Module

Handles payment creation, Stripe checkout attempts, payment status tracking, transaction retrieval, and webhook-based payment confirmation.

## APIs

| Method | Endpoint | Function |
|---|---|---|
| POST | `/api/payments` | Create a payment for a ride |
| POST | `/api/payments/:paymentId/attempts` | Create or reuse a Stripe checkout attempt using an idempotency key |
| GET | `/api/payments/:paymentId` | Retrieve payment details with the latest attempt |
| GET | `/api/payments/transactions` | Retrieve a paginated and searchable list of transactions |
| GET | `/api/payments/transactions/:transactionId` | Retrieve a transaction by ID |
| POST | `/api/webhooks/stripe` | Process Stripe payment webhook events |

## Payment Lifecycle

- A payment is created for a ride and initially has `PENDING` status.
- A checkout attempt is created when the user initiates payment.
- Each logical checkout attempt uses an idempotency key to prevent duplicate attempts caused by request retries.
- Repeated requests with the same key reuse the existing attempt when applicable.
- A new attempt can be created after the previous attempt has failed or is no longer usable, using a new idempotency key.
- The payment becomes `SUCCESS` after the backend receives and processes a valid payment confirmation from Stripe.
- Payment status and the latest checkout attempt can be retrieved using the payment ID.

## Data Models

- **Payment:** Stores the overall payment obligation associated with a ride, including its amount and status.
- **PaymentAttempt:** Stores individual checkout attempts, provider details, idempotency keys, and attempt status.
- **Transaction:** Stores the resulting financial transaction associated with a successful payment.
- **PaymentWebhookEvent:** Tracks processed webhook events to support duplicate-event detection.

## Stripe Integration

- Stripe Checkout is used to initiate payment.
- Stripe webhooks communicate payment events to the backend.
- The backend processes successful checkout events and updates the payment and transaction records.
- Duplicate webhook events are detected using the provider and event ID.
- The frontend does not determine payment success solely from the checkout redirect; the backend processes the provider's confirmation.

## Security & Validation

- JWT authentication is required for payment and transaction APIs.
- Zod validates request bodies, route parameters, and transaction-list query parameters.
- Idempotency keys help prevent duplicate checkout attempts on request retries.
- Payment state is checked before creating another checkout attempt.
- Webhook processing uses Stripe event data and duplicate-event detection.

## Architecture

```text
User initiates payment
        │
        ▼
Create Payment
        │
        ▼
Create Checkout Attempt
        │
        ├── Same idempotency key
        │       └── Reuse existing attempt when applicable
        │
        └── New idempotency key
                └── Validate state and create a new attempt
        │
        ▼
Stripe Checkout
        │
        ▼
Stripe Webhook
        │
        ▼
Update Payment Status
        │
        ▼
Create / Update Transaction
```

## Status: Tested

The payment, checkout-attempt, payment-retrieval, transaction-list, and transaction-detail APIs have been tested. The Stripe webhook route is configured for webhook event processing.
