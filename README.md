# Multi-Tenant Enterprise SaaS Backend

A multi-tenant REST API built with **Node.js, Express, and PostgreSQL**, designed around the security needs of financial and enterprise SaaS workloads: **granular RBAC**, **refresh token rotation with reuse detection**, **cross-tenant (BOLA/IDOR) isolation**, and **SHA-256 hash-chained compliance audit logs**.

---

## Tech Stack

Node.js · Express · PostgreSQL · JWT · bcrypt · Joi · helmet · express-rate-limit · Jest · Supertest

---

## Core Architecture & Security Highlights

### 1. Multi-Tenant Data Isolation (Shared Database, Shared Schema)
- Every tenant-owned resource (`users`, `roles`, `customers`, `audit_logs`) is partitioned by `tenant_id`.
- Repository queries use composite lookups (`WHERE id = $1 AND tenant_id = $2`), with `tenant_id` taken only from the verified JWT (`req.user.tenantId`), never from the request body. This neutralizes **Broken Object Level Authorization (BOLA / IDOR)** and mass-assignment attacks.
- Tenant registration runs inside an explicit PostgreSQL transaction (`BEGIN` / `COMMIT` / `ROLLBACK`), atomically provisioning the tenant, default roles (`ADMIN`, `MANAGER`, `VIEWER`), role-permission mappings, and the founding administrator.

### 2. Dual-Token Authentication & Reuse Breach Detection
- **Access tokens (15 min TTL):** stateless, signed JWTs carrying `userId`, `tenantId`, `roles`, and `permissions` claims.
- **Refresh tokens (7 day TTL):** high-entropy random strings stored as **SHA-256 hashes** in the `refresh_tokens` table, so a database leak never exposes usable session tokens.
- **Rotation & replay detection:** every `POST /api/v1/auth/refresh` revokes the current token (`revoked_at = NOW()`) and issues a fresh pair. If a revoked token is replayed, the server treats it as a breach and **revokes all active refresh tokens for that user**.

### 3. Granular Role-Based Access Control (RBAC)
- 5-table relational model: `users` ↔ `user_roles` ↔ `roles` ↔ `role_permissions` ↔ `permissions`.
- Routes enforce fine-grained `resource:action` slugs (`customers:read`, `customers:create`, `customers:update`, `customers:delete`, `users:manage`, `audit:read`) instead of hardcoded role names.
- Follows the **principle of least privilege**: new users default to `VIEWER`, and a user's refresh tokens are revoked whenever an admin changes their role.

### 4. Tamper-Evident Audit Trail (`audit_logs`)
- Append-only compliance table storing actor metadata, client IP, and structured `JSONB` payloads.
- **SHA-256 hash chain** (`prev_hash` → `curr_hash`) computed over **canonical JSON** (recursive alphabetical key sorting, `undefined` values dropped) so hashes stay deterministic despite PostgreSQL `JSONB` reordering keys.
- Writes are serialized per tenant with `SELECT ... FOR UPDATE` so concurrent requests can never fork the chain.
- `GET /api/v1/audit-logs/verify` recomputes the chain from the genesis block and detects any modified or deleted row.

### 5. API Hardening & Rate Limiting
- **HTTP headers:** `helmet` (removes `X-Powered-By`, enables HSTS, `X-Content-Type-Options: nosniff`).
- **Payload protection:** `express.json({ limit: '10kb' })` to prevent oversized-body memory exhaustion.
- **Input validation:** strict Joi schemas on request bodies.
- **Two-tier rate limiting:** a global limiter (100 req / 15 min) and a stricter auth limiter (10 req / 15 min) placed ahead of `bcrypt` to blunt brute-force and CPU-exhaustion attempts.

---

## Database Schema (9 Tables)

| Table | Purpose | Key Constraints |
| :--- | :--- | :--- |
| `tenants` | Organization registry | `id UUID PRIMARY KEY` |
| `users` | Tenant-scoped user accounts | `UNIQUE(tenant_id, email)`, `ON DELETE CASCADE` |
| `roles` | Tenant-scoped roles (`ADMIN`, `MANAGER`, `VIEWER`) | `UNIQUE(tenant_id, name)` |
| `permissions` | Global permission slugs (`customers:create`, etc.) | `slug VARCHAR UNIQUE` |
| `role_permissions` | Maps roles to permissions | `PRIMARY KEY (role_id, permission_id)` |
| `user_roles` | Maps users to roles | `PRIMARY KEY (user_id, role_id)` |
| `refresh_tokens` | Hashed refresh token ledger | `token_hash`, `revoked_at`, `expires_at` |
| `customers` | Tenant-isolated customer records | scoped by `tenant_id` |
| `audit_logs` | Append-only hash-chained ledger | `prev_hash`, `curr_hash`, `ON DELETE SET NULL` on `actor_id` |

---

## API Endpoints

| Method | Endpoint | Auth / Permission | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Public | Liveness check |
| `POST` | `/api/v1/auth/register` | Public (`authLimiter`) | Atomic tenant + founding `ADMIN` provisioning |
| `POST` | `/api/v1/auth/login` | Public (`authLimiter`) | Issues access JWT + refresh token |
| `POST` | `/api/v1/auth/refresh` | Public (`authLimiter`) | Rotates refresh token, detects replay |
| `POST` | `/api/v1/auth/logout` | `authenticate` | Revokes the active refresh token |
| `GET` | `/api/v1/auth/me` | `authenticate` | Current user profile |
| `GET` | `/api/v1/users` | `users:manage` | Lists users in caller's tenant |
| `POST` | `/api/v1/users` | `users:manage` | Onboards a user (defaults to `VIEWER`) |
| `PATCH` | `/api/v1/users/:id/role` | `users:manage` | Changes role and revokes user's refresh tokens |
| `GET` | `/api/v1/customers` | `customers:read` | Lists tenant customers |
| `GET` | `/api/v1/customers/:id` | `customers:read` | Fetches one customer (tenant-scoped) |
| `POST` | `/api/v1/customers` | `customers:create` | Creates customer, appends audit log |
| `PATCH` | `/api/v1/customers/:id` | `customers:update` | Updates customer, appends audit log |
| `DELETE` | `/api/v1/customers/:id` | `customers:delete` | Deletes customer, appends audit log |
| `GET` | `/api/v1/audit-logs` | `audit:read` | Paginated, filterable audit logs |
| `GET` | `/api/v1/audit-logs/verify` | `audit:read` | Verifies hash-chain integrity |

---

## Getting Started

### 1. Clone and install
```bash
git clone https://github.com/Amit-64/multi-tenant-saas-backend.git
cd multi-tenant-saas-backend
npm install
```

### 2. Configure environment variables
Copy `.env.example` to `.env` and set your PostgreSQL credentials and JWT secret:
```bash
cp .env.example .env
```

### 3. Run database migrations
```bash
npm run migrate
```

### 4. Start the development server
```bash
npm run dev
```

### 5. Run the test suite (Jest + Supertest)
```bash
npm test
```

The integration tests cover tenant onboarding, token replay detection, RBAC enforcement, cross-tenant BOLA attempts, and audit hash-chain verification.

---

## Design Decisions

- **SHA-256 for refresh tokens, bcrypt for passwords:** refresh tokens are 320-bit random values, so a fast hash is enough; bcrypt's cost is only worthwhile for low-entropy, human-chosen passwords.
- **`bcrypt` runs outside the registration transaction:** keeps the database connection and locks held for as short a time as possible.
- **Stateless access tokens, stateful refresh tokens:** authorization checks need no database round-trip, while revocation is still possible at refresh time.
- **Scaling note:** the API is stateless, so it scales horizontally. For multiple instances, swap the in-memory rate-limit store for a shared one such as Redis.

---

