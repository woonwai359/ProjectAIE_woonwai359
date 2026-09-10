# csmju-coop-hours

**CSMJU Co-op Prep & Activity Hours Tracking System** — a plug-in subsystem of
the **CSMJU2030** ecosystem (สาขาวิชาวิทยาการคอมพิวเตอร์ คณะวิทยาศาสตร์
มหาวิทยาลัยแม่โจ้).

Full-stack Next.js 14 (App Router) app: Server Components + Server Actions,
Prisma ORM, PostgreSQL. No custom login — identity comes entirely from the
central API Gateway via headers, per the CSMJU2030 Auth Contract.

## Stack

- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Prisma ORM + PostgreSQL (isolated database — no cross-subsystem FKs)
- Zod for input validation
- No client-side database access — everything goes through Server Actions

## Getting started

```bash
npm install
cp .env.example .env      # set DATABASE_URL to your local Postgres
npx prisma migrate dev --name init
npm run prisma:seed       # optional demo data
npm run dev
```

Visit `http://localhost:3000` — it redirects to `/dashboard`.

## Local auth (no Gateway required)

`middleware.ts` injects mock identity headers when `MOCK_AUTH=true`, so you
can develop without a real API Gateway in front of the app:

- Edit `MOCK_ROLE` in `.env` (`student` or `staff`) and restart `next dev`, or
- Override per-request with headers, e.g.:

  ```bash
  curl -H "x-mock-role: staff" -H "x-mock-user-id: staff-somchai" http://localhost:3000/api/health
  ```

`MOCK_AUTH` **must be `false` in production** — the real Gateway supplies
`x-user-id` / `x-layer1-role` / `x-faculty` directly, and this app never
verifies JWTs itself (see `lib/auth.ts`).

## Two-tier RBAC

| | Layer 1 (central) | Layer 2 (this subsystem) |
|---|---|---|
| Set by | Central Admin / registrar import | This app, derived from Layer 1 + `subsystem.yaml` exceptions |
| Values | `student`, `alumni`, `staff`, `admin` | `student`, `admin` |
| Rule | — | `staff`/`admin` at Layer 1 → subsystem `admin`. Everyone else → `student`, unless their `x-user-id` is listed in `SUBSYSTEM_ADMIN_EXCEPTIONS` (mirrors `subsystem.yaml requested_exceptions`, e.g. the AIE who built this system). |

## Co-op 15-hour rule

Dashboard progress (`components/CoopProgress.tsx`) is calculated **only**
from `coopHours`:

```
percentage = min(100, (coopHoursEarned / 15) * 100)
```

Volunteer and major-non-co-op hours are tracked and displayed separately and
never affect this percentage. Once `coopHoursEarned >= 15`, the "มีสิทธิ์ยื่น
สหกิจศึกษา" badge appears.

## Registration & waiting list

`lib/actions/activity.ts#registerActivity` runs inside a `Serializable`
Prisma transaction:

1. Real seats fill first (`REGISTERED`, up to `capacity`).
2. Once full, up to **5** more registrations go to `WAITING` with
   `queueNumber: 1..5`.
3. Beyond that, registration is rejected ("ที่นั่งและคิวสำรองเต็มแล้ว").

`cancelRegistration` auto-promotes `queueNumber: 1` to `REGISTERED` and
shifts the remaining queue up by one, all inside one transaction.

## Attendance & hour crediting

Staff/admin confirm attendance from the physical sign-in sheet on
`/admin/activities/[id]/attendance` (bulk select-all + individual
uncheck). Confirming:

- Marks checked students `ATTENDED` and credits `coopHours` /
  `volunteerHours` / `majorHours` from the activity into
  `UserHourSummary`, snapshotted onto the `Registration` row so later edits
  to the activity don't retroactively change history.
- Marks unchecked (previously seated) students `ABSENT` and reverses any
  previously-credited hours if attendance is corrected.

## Printable sign-in sheet

`/admin/activities/[id]/print` renders an A4-formatted sheet
(`@media print` rules in `app/globals.css`) with activity header, a numbered
table for seated students (signature + remarks columns), and a fixed
5-row waiting-list section — all app chrome (`.no-print`) is hidden when
printing.

## Deliverables map

| Requirement | File |
|---|---|
| Data model | `prisma/schema.prisma` |
| Auth headers + RBAC | `lib/auth.ts`, `middleware.ts` |
| Server Actions | `lib/actions/activity.ts` |
| Student dashboard | `app/dashboard/page.tsx` |
| Printable sign-in sheet | `app/admin/activities/[id]/print/page.tsx` |
| Attendance confirmation | `app/admin/activities/[id]/attendance/page.tsx` |
| Health check | `app/api/health/route.ts` |
| Subsystem manifest | `subsystem.yaml` |

Before requesting sign-off from the PM, update `subsystem.yaml` with your
real `x-user-id` and confirm `standards_version` matches the current
`csmju2030-standards` `.md` files.
