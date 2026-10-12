# AcxiomCRM — Next.js + ASP.NET Core + Supabase

A source-code project for the selected architecture: **Next.js frontend on Vercel → ASP.NET Core REST API on Railway → Supabase PostgreSQL**. This replaces the earlier Next.js-only starter.

## What is included
- Next.js responsive sidebar, login/register, role-aware navigation and logout.
- Dashboard KPIs and Chart.js lead, pipeline and monthly sales charts.
- Customer, lead, opportunity, follow-up and activity create/read/update/deactivate screens with search, filtering, sorting and pagination.
- Opportunity pipeline board (current paginated results); qualified-lead-to-customer conversion.
- Admin user creation/editing, roles, account activation, unlock and password reset; audit viewer.
- ASP.NET Core Identity password policy/hashing/lockout, short-lived bearer authentication and revocation via security stamps.
- Server-side role/team/owner scope, business validation, EF Core PostgreSQL models, explicit record DTOs, concurrency checking and transactional CRM audit writes.
- Date-filtered scoped analytics, weighted pipeline and conversion reports; module tables serve as detailed operational reports.

## Verification status — read before use
The frontend production build and TypeScript check have passed. The .NET API has **not been compiled or executed in this environment**, and no database integration, end-to-end browser or security acceptance tests have run. Treat backend source as an implementation requiring local verification, not a certified finished submission. No live deployment or Supabase resources have been created. See docs/acceptance.md.

## Prerequisites
Node.js 22/24, .NET SDK 10, and a PostgreSQL database (local or Supabase). Never place database passwords or JWT secrets in NEXT_PUBLIC variables.

## 1. Database and backend
Supabase dashboard → Connect → choose session pooler when your server requires IPv4. Use the shown hostname, username and password. Use a .NET/Npgsql connection string, not the postgres:// URL:

```text
Host=YOUR_SESSION_POOLER;Port=5432;Database=postgres;Username=postgres.YOUR_PROJECT;Password=YOUR_PASSWORD;SSL Mode=VerifyFull
```

Supply settings as environment variables, user-secrets or Railway variables. `.env.example` is a reference; dotnet does not automatically load this file.

```bash
cd backend
dotnet restore
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "YOUR_NPGSQL_CONNECTION_STRING"
dotnet user-secrets set "Jwt:Key" "YOUR_RANDOM_SECRET_AT_LEAST_32_BYTES"
dotnet user-secrets set "Bootstrap:Email" "YOUR_ADMIN_EMAIL"
dotnet user-secrets set "Bootstrap:Password" "YOUR_STRONG_PASSWORD"
dotnet tool install --global dotnet-ef --version 10.0.0
dotnet ef migrations add InitialCreate
dotnet ef database update
dotnet run -- --bootstrap
dotnet run --urls http://localhost:5000
```

Migrations are intentionally generated after backend verification; this ZIP does not contain a generated migration. Commit the reviewed generated migration before deploying. Bootstrap creates roles and the first admin, then exits. It never elevates an existing non-admin account. Use `DOTNET_ENVIRONMENT=Development` when using local user-secrets; `dotnet run` launch settings already select Development.

Public registration is disabled by default. Admin can create staff accounts. To demonstrate registration locally, set `Auth:AllowRegistration=true`; it always creates SalesExecutive accounts with no team. A manager sees no team records until an Admin supplies matching team identifiers for the manager and staff.

## 2. Frontend
```bash
cd frontend
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000 and sign in with the bootstrapped admin. Add users, then CRM records. Phone fields use international E.164 format (+919876543210). Backend must be running; no demo dataset or fake login is bundled.

```bash
npm run typecheck
npm run build
```

Sessions remain in React memory to avoid persistent browser token storage. A reload or new tab requires login again. Tokens expire after 30 minutes; there is no refresh flow. Logout invalidates all active sessions for that user. A cookie/BFF session upgrade can be added later.

## Deployment
See docs/deployment.md for Vercel, Railway and Supabase steps. The frontend calls the API directly over HTTPS using bearer headers and an explicit CORS origin allowlist. It does not connect to Supabase directly or use Supabase Auth.

## Assignment fit
Identity, EF Core, secured REST endpoints and Chart.js follow the selected requirements. Next.js replaces MVC/Razor and custom CSS replaces Bootstrap, so the package does not satisfy those framework-specific requirements without evaluator approval. Bearer-authenticated mutations use no authentication cookies, so MVC anti-forgery-token mechanics do not apply to this architecture.
