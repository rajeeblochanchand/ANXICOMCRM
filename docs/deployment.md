# Deployment checklist

## Supabase
Create a PostgreSQL project and obtain its connection details. Prefer the direct connection for a persistent backend where IPv6 works; use the session pooler on port 5432 if IPv4 is needed. SSL must be verified. Use a dedicated database role with only the necessary permissions when moving beyond the assignment environment. All database access occurs in the API: never ship database credentials to the frontend. Supabase Auth is not used. The database account/API performs authorization; browser clients must not be given direct unrestricted access to CRM tables.

## Railway backend
1. Push the source to your repository. Create a Railway service with root directory `backend` and the supplied Dockerfile.
2. Set `ConnectionStrings__DefaultConnection`, `Jwt__Key`, `Jwt__Issuer=AcxiomCRM.Api`, `Jwt__Audience=AcxiomCRM.Web`, `AllowedOrigins=https://YOUR_FRONTEND.vercel.app`, `Auth__AllowRegistration=false`. The signing secret must be random and at least 32 bytes. Configure target port 8080 and health path `/health`.
3. First verify `dotnet restore` and `dotnet build -c Release` locally. Generate and review the EF migration. Apply it using a controlled deployment job/local command with authorized credentials. The API does not automatically migrate on ordinary startup.
4. Run bootstrap once with temporary `Bootstrap__Email` and `Bootstrap__Password` settings, then remove those settings. Bootstrap migrates, seeds roles and creates the initial Admin, then exits. Do not use bootstrap as the normal web start command.
5. Deploy via Railway HTTPS. No API secret belongs in Git or the frontend. The in-process authentication limiter is per-instance; persistent/shared rate limiting and verified proxy-IP handling are production hardening tasks. Railway proxy traffic may share an IP, so the local limiter is not a complete distributed defense.

## Vercel frontend
Import the repository with root directory `frontend`; framework Next.js. Set `NEXT_PUBLIC_API_URL=https://YOUR_API_HOST/api`. Deploy. Add the exact final frontend URL to Railway `AllowedOrigins`, excluding wildcards. API URL is public configuration; it is not a secret. Preview domains require deliberate allowlist configuration.

## Acceptance before submission
Complete docs/acceptance.md. This ZIP has no live hosting, migration or end-to-end verification. Migrate only through a reviewed command. Preserve database backups, rotate secrets, restrict public registration, and verify every role by direct API requests before adding real data.

Reference documentation:
- https://learn.microsoft.com/en-us/aspnet/core/security/authentication/configure-jwt-bearer-authentication?view=aspnetcore-10.0
- https://www.npgsql.org/efcore/release-notes/10.0.html
- https://supabase.com/docs/guides/database/connecting-to-postgres
