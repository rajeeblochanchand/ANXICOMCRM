# Architecture

Next.js client workspace → HTTPS REST API → ASP.NET Controllers → CrmService / Scope → EF Core DbContext → PostgreSQL. Identity owns user/password/role/lockout persistence. All CRM APIs require authentication. Users/audit administration requires Admin. Managers can access exactly their nonempty team identifier; SalesExecutive queries match OwnerId. The verified JWT contains roles and team claims and a security stamp; every request rechecks active user, lockout and stamp. User role/team/account changes and password reset revoke existing tokens.

## Source organization
- frontend/src/components/workspace.tsx: connected screens, forms, filters and charts.
- backend/Models: Identity user, customer, lead, opportunity, follow-up, activity, audit models.
- backend/Contracts: request validation and explicit CRM response DTOs.
- backend/Data: IdentityDbContext and EF mapping, separate TPC CRM tables.
- backend/Services: authorization scope, validation, workflow and audit creation.
- backend/Controllers: authentication, CRM REST APIs, users, insights and audit endpoints.

The shared CrmRecord base uses table-per-concrete-type mapping, so each CRM entity receives its own table. Fields shared through the base simplify the assignment implementation, at the cost of unused columns in individual tables. GUID IDs, fixed-precision amounts, unique customer email/phone and restrictive relationships are used. Records are deactivated using IsDeleted to preserve history. TeamId is an administrator-controlled identifier, not a dedicated team-management module. Changes to a user's team require first reassigning their records.

POST/PUT binds RecordInput, not database models. Owner/team/creator and codes are controlled by server logic. Responses use RecordView. Related customer/lead/opportunity IDs are checked in the actor's scope and must match the chosen owner's team. CRM mutation plus audit uses one EF SaveChanges transaction. Lead conversion creates a customer and marks the lead Converted in the same transaction. Customer duplicate unique constraints roll back conversion if duplicate email/phone exists. Conversion does not create an opportunity automatically; create it afterward. Concurrency uses PostgreSQL xmin; edits submit the version shown when fetched. Delete operations preserve history.

Status/stage lists and lead transitions are validated on the server. Open opportunities require positive amount, probability 0–100 and a close date today or later. Follow-up/Activity require related records, recognized type and a date. New planned follow-ups cannot precede today. Business date comparisons use Asia/Kolkata; stored timestamps use UTC. Database check constraints are not yet added; critical business rules are in services and should be mirrored in reviewed migrations where practical.

API returns 400 for annotation validation, 401 for missing/expired login, 403 for forbidden roles, 404 for inaccessible records, 422 for business validation, and 409 for duplicate or concurrency conflicts. Unexpected errors return safe messages. Health checks application availability only, not database availability.

## Current UI limits
All screens share a single root workspace rather than individual Next.js URL routes. Filters, forms and charts communicate with the .NET API. Pipeline board displays the current table page. Relationship pickers show up to 100 authorized records; searchable remote pickers are a future scaling improvement. User/audit pages are Admin-only. Reports include pipeline, conversion and operational tables; user-activity aggregates are available to Admin/Manager; CSV/PDF export is not implemented. Customer/lead detail dialogs include audit history and up to 100 linked opportunities, follow-ups and activities. Modal dialogs support focus trapping and Escape dismissal.
