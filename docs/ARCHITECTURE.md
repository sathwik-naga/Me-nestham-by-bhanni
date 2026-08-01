# System Architecture & Technical Reference
## Me Nestham By Bhanni (Production v1.1)

---

### 1. High-Level Architecture Overview

```
                          ┌───────────────────────────┐
                          │   Vercel Global Edge CDN  │
                          │   (React 19 + Vite SPA)   │
                          └─────────────┬─────────────┘
                                        │ HTTPS
                                        ▼
                          ┌───────────────────────────┐
                          │    Render Web Service     │
                          │ (Express 5 + TypeScript)  │
                          └──────┬─────────────┬──────┘
                                 │             │
                    ┌────────────▼──┐       ┌──▼────────────┐
                    │ Upstash Redis │       │ Supabase DB & │
                    │ REST Caching  │       │ Auth & Storage│
                    └───────────────┘       └───────────────┘
```

---

### 2. Database ER Diagram

```
[ users (Supabase Auth) ]
       │ 1:1
[ profiles ]
       │ 1:N
 ┌─────┴───────────────────┬───────────────────────┐
 │                         │                       │
[ orders ]            [ wishlists ]            [ reviews ]
 │ 1:N                     │                       │
[ order_items ] ── N:1 ── [ products ] ── N:1 ── [ categories ]
                           │ 1:N
                      [ product_variants ]
```

---

### 3. Environment Variable Reference

| Variable Name | Environment | Required | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Backend | No (Default 5000) | Express server port |
| `NODE_ENV` | Both | Yes | `development` \| `production` \| `test` |
| `SUPABASE_URL` | Both | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Both | Yes | Supabase anon API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Yes | Supabase admin service key |
| `UPSTASH_REDIS_REST_URL` | Backend | Optional | Upstash Redis REST endpoint URL |
| `UPSTASH_REDIS_REST_TOKEN` | Backend | Optional | Upstash Redis REST bearer token |
| `RESEND_API_KEY` | Backend | Optional | Transactional email provider API key |
| `RAZORPAY_KEY_ID` | Backend | Optional | Razorpay payment gateway key |
| `RAZORPAY_KEY_SECRET` | Backend | Optional | Razorpay payment gateway secret |

---

### 4. Incident Response & Troubleshooting

1. **High DB Latency / Database Degradation**:
   - Run `migration_phase5_indexes.sql` to re-apply composite indexes and `pg_trgm` GIN indexes.
2. **Upstash Redis Failure**:
   - `CacheService` automatically switches to local memory caching without throwing exceptions.
3. **2FA Email Delivery Failure**:
   - Check `email_logs` table in Admin Dashboard (`/admin/emails`). Resend fallback mode dispatches over SMTP.
