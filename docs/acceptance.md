# Verification and assignment acceptance

## Verified here
- Frontend TypeScript check.
- Next.js optimized production build.

## Not verified here
- .NET package restore/compilation/runtime.
- PostgreSQL migrations, EF mappings and API database operations.
- Browser/end-to-end interactions or live hosting.
- Full security and PDF acceptance suite.

## Required local commands
```bash
cd backend
dotnet restore
dotnet build -c Release
dotnet ef migrations add InitialCreate
dotnet ef database update
dotnet run -- --bootstrap
dotnet run
```
Follow README.md for secrets first. Check generated table mapping, unique constraints, foreign keys and concurrency column. Run the following cases and record results before submission:

1. Anonymous requests to CRM return 401; no data is shown without login.
2. Invalid credentials fail; five failed attempts trigger 15-minute Identity lockout.
3. Register (when enabled) always creates SalesExecutive; injected role cannot promote account.
4. Admin creates Manager and SalesExecutive accounts with explicit teams; managers cannot query another team's records, and sales users cannot query another owner's records using changed IDs or filter parameters.
5. Invalid email/phone, required name, numeric bounds and duplicate customer are rejected, including manually crafted API payloads.
6. Opportunity amount zero/negative, probability above 100, past active close date and inconsistent stage/status are rejected.
7. New/planned past follow-up is rejected, including timezone boundaries.
8. Qualified lead converts once into a customer; a duplicate customer rejects the transaction without half-conversion. Other statuses cannot convert.
9. CRUD generates an audit event and deactivation preserves the row. Non-Admin cannot use user/audit endpoints.
10. Password reset, role/status changes and logout invalidate old tokens.
11. Search/filter/sort/pagination and all Chart.js datasets contain only authorized records.
12. Two concurrent edits cause stale version rejection; refresh retrieves the current record.
13. Verify API DTOs and logs contain no password hash, JWT, reset token or credential.
14. Verify required operational reports and consolidated customer history expectations with evaluator; Exports are not implemented; related-record pickers/details are capped at 100 rows.
15. Confirm evaluator accepts Next.js instead of MVC/Razor and CSS instead of Bootstrap.

The code provides a broad CRM implementation but is not declared a fully verified or complete assignment submission until these checks and the listed gaps are resolved.
