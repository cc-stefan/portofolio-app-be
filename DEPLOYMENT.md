# Deployment Guide

This guide deploys the project with:

- Frontend: Vercel
- Backend API: Render
- Database: Neon Postgres
- File storage: Cloudflare R2
- Source control: GitHub
- Package manager: pnpm

This replaces the earlier self-hosted / Docker-on-a-single-machine approach with a managed setup that fits the current stack better.

## 1. Recommended Architecture

Production layout:

- `https://mydomain.com` -> Vercel -> Next.js frontend
- `https://www.mydomain.com` -> Vercel -> optional redirect or alias
- `https://api.mydomain.com` -> Render Web Service -> NestJS backend
- Neon -> PostgreSQL database for application data
- Cloudflare R2 -> uploaded images and files

Deployment flow:

1. Frontend repo (`portfolio-app-fe`) is connected to Vercel
2. Backend repo (`portfolio-app-be`) is connected to Render
3. Neon provides the Postgres connection string used by the backend
4. Cloudflare R2 stores uploaded files
5. Git pushes trigger platform-native deployments

## 2. Important Current Project Constraints

These repo-specific details matter before you go live:

### Frontend env names

The current frontend reads:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_API_URL`
- `PORTFOLIO_API_BASE_URL`
- `NEXT_PUBLIC_PORTFOLIO_API_BASE_URL`

This means you can standardize on `NEXT_PUBLIC_API_URL` while keeping the existing portfolio-specific names during rollout.

The relevant code is in [src/lib/backend.ts](/Users/ccs/development/portfolio-app/portfolio-app-fe/src/lib/backend.ts:1).

### Frontend local builds should not force `NODE_ENV`

Keep the frontend scripts plain:

- `pnpm build` -> `next build`
- `pnpm start` -> `next start`

Reason:

- Vercel already runs production builds and production runtime automatically
- local project scripts should not override the environment mode behind the user's back
- if a local shell exports `NODE_ENV=development` globally, fix the shell config instead of hardcoding `NODE_ENV=production` into `package.json`

Practical note:

- do not export `NODE_ENV` globally from `~/.zshrc`, `~/.zprofile`, or similar shell startup files for this project
- if needed, use `unset NODE_ENV` in the current terminal before running a local production build

### Backend CORS env name

The current backend reads:

- `CORS_ORIGIN`
- `FRONTEND_URL`

If both are set, `CORS_ORIGIN` takes precedence.

The relevant code is in [src/setup-app.ts](/Users/ccs/development/portfolio-app/portfolio-app-be/src/setup-app.ts:1).

### Upload storage now supports R2 directly

The current backend supports two storage modes:

- Cloudflare R2 when the full `R2_*` env set is present
- local filesystem under `uploads/` when the `R2_*` env set is absent

That is implemented in [src/uploads/uploads.service.ts](/Users/ccs/development/portfolio-app/portfolio-app-be/src/uploads/uploads.service.ts:1).

For Render deployments, treat the R2-backed path as the production configuration. The local filesystem path remains useful only for local development and temporary fallback.

### Frontend and backend are separate repos

You currently have:

- `portfolio-app-fe`
- `portfolio-app-be`

That means frontend and backend deploy independently. Cross-repo changes are not atomic, so keep API changes backward-compatible during rollout.

## 3. Required Accounts and Services

You need:

- GitHub account and repositories for both apps
- Vercel account
- Render account
- Neon account
- Cloudflare account
- Domain name

Recommended domains:

- `mydomain.com`
- `www.mydomain.com`
- `api.mydomain.com`
- `assets.mydomain.com` for R2 public asset delivery

## 4. Environment Variables

### Frontend (Vercel)

Set these in Vercel for the frontend project.

### Production

```env
NEXT_PUBLIC_SITE_URL=https://mydomain.com
NEXT_PUBLIC_API_URL=https://api.mydomain.com/api
PORTFOLIO_API_BASE_URL=https://api.mydomain.com/api
NEXT_PUBLIC_PORTFOLIO_API_BASE_URL=https://api.mydomain.com/api
```

### Preview / Development

At minimum:

```env
NEXT_PUBLIC_API_URL=https://api.mydomain.com/api
PORTFOLIO_API_BASE_URL=https://api.mydomain.com/api
NEXT_PUBLIC_PORTFOLIO_API_BASE_URL=https://api.mydomain.com/api
```

Notes:

- `NEXT_PUBLIC_SITE_URL` is used by the current frontend as a concrete base URL
- if you want preview deployments to self-reference their own Vercel URL cleanly, update the frontend to derive the site URL from Vercel system environment variables
- with the current code, using the production site URL for preview metadata is acceptable, but not ideal

### Backend (Render)

Set these in Render for the backend web service:

```env
NODE_ENV=production
APP_HOST=0.0.0.0
CORS_ORIGIN=https://mydomain.com,https://www.mydomain.com
FRONTEND_URL=https://mydomain.com,https://www.mydomain.com
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=replace-with-a-different-long-random-secret
JWT_REFRESH_EXPIRES_IN=30d
R2_ACCOUNT_ID=replace-with-your-cloudflare-account-id
R2_ACCESS_KEY_ID=replace-with-your-r2-access-key-id
R2_SECRET_ACCESS_KEY=replace-with-your-r2-secret-access-key
R2_BUCKET_NAME=portfolio-assets
R2_PUBLIC_URL=https://assets.mydomain.com
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

Notes:

- Render already provides `PORT`; do not hardcode a conflicting value unless you have a specific reason
- keep `APP_HOST=0.0.0.0` because Render requires web services to bind publicly on `0.0.0.0`
- prefer setting the full `R2_*` env set in production so uploads never touch local disk

### Temporary local-upload fallback

Only if you have not migrated uploads to R2 yet:

```env
UPLOAD_DIR=uploads
UPLOAD_URL_PREFIX=/uploads
```

This is not the recommended production path on Render.

### Database (Neon)

For the current repo, keep one working `DATABASE_URL` first.

Recommended starting point:

- use a standard Neon Postgres connection string with `sslmode=require`
- keep it in Render as `DATABASE_URL`

Example:

```env
DATABASE_URL=postgresql://portfolio_user:replace-me@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

Important:

- the current repo validates only `DATABASE_URL`
- it does not currently use a separate `DIRECT_URL`, `DATABASE_URL_UNPOOLED`, or Prisma-specific Neon split configuration
- if you later refactor Prisma for separate runtime and migration URLs, update the deployment guide and app config together

## 5. Neon Setup

Neon is the production database for this stack.

### Step 1: Create the Neon project

In Neon:

1. Create a new project
2. Pick a region close to your Render backend region
3. Create a database and role for the application

Choose the Neon region based on the backend location, not the frontend. The frontend is global on Vercel, but the backend makes the database calls.

### Step 2: Choose a branch strategy

Recommended:

- `main` or `production` branch for live traffic
- optional `staging` branch if you later add a staging backend
- optional per-developer branches for testing schema changes

Keep production simple first:

- one production branch
- one production connection string

### Step 3: Copy the connection string

From Neon, copy the application connection string and store it in Render as:

```env
DATABASE_URL=...
```

Use `sslmode=require`.

### Step 4: Backups and recovery

Neon gives you:

- branching
- restore windows
- point-in-time recovery
- snapshots / backup-and-restore features depending on your plan

For production:

- keep the production branch protected
- periodically export logical backups with `pg_dump`
- know your restore procedure before launch

## 6. Prisma in Production

The backend already runs Prisma generate during install/build:

- `postinstall`: `prisma generate`
- `prebuild`: `prisma generate`

That is good and should stay.

### Use this migration command in production

Use:

```bash
pnpm prisma migrate deploy
```

Why:

- it applies committed migrations
- it is designed for CI/CD and non-interactive deploys

### Do not use this in production

Do not run:

```bash
pnpm prisma migrate dev
```

That command is for local development only.

### Seeding / admin creation

This repo includes:

```bash
pnpm admin:create
```

Use it only when explicitly needed, for example after the first production deploy.

On Render:

- paid web services can run this as a one-off job or from the service shell
- free web services do not support one-off jobs or shell access

If you stay on the Render free instance type, run the script locally against the production `DATABASE_URL` instead of expecting Render-side shell access.

## 7. Cloudflare R2 Setup

R2 should be the production file store for this stack.

### Step 1: Create the bucket

Create a bucket such as:

- `portfolio-assets`

You can do it in the dashboard or with Wrangler:

```bash
npx wrangler r2 bucket create portfolio-assets
```

### Step 2: Create access keys

Create credentials with the minimum required permissions:

- Object Read
- Object Write

Store:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_ENDPOINT`

### Step 3: Configure a production asset domain

Prefer a custom domain such as:

- `assets.mydomain.com`

Set:

```env
R2_PUBLIC_URL=https://assets.mydomain.com
```

Do not rely on `r2.dev` for production.

### Step 4: Configure CORS if browsers access the bucket directly

Example CORS policy:

```json
[
  {
    "AllowedOrigins": ["https://mydomain.com", "https://www.mydomain.com"],
    "AllowedMethods": ["GET", "HEAD", "PUT", "POST"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

If uploads continue to go through the backend only, CORS can often stay narrower.

### Step 5: Store metadata in Postgres, files in R2

Recommended split:

- Neon/Postgres stores:
  - object key
  - public URL
  - original filename
  - MIME type
  - size
- R2 stores:
  - the actual file bytes

Current schema note:

- today the project stores `Project.imageUrl`
- if you want richer file metadata, add a dedicated file table or extend the model

### Step 6: Use stable object keys

Recommended key patterns:

- `projects/{projectId}/cover/{filename}`
- `projects/{projectId}/gallery/{uuid}-{filename}`
- `uploads/{year}/{month}/{uuid}-{filename}`

### Step 7: Keep backend validation

The current backend already restricts project images to:

- JPEG
- PNG
- WEBP
- GIF
- AVIF
- 5 MB max size

Keep those checks after migrating to R2.

## 8. Vercel Frontend Deployment

Use Vercel for `portfolio-app-fe`.

### Step 1: Import the repo

In Vercel:

1. Create a new project
2. Import `portfolio-app-fe`
3. Let Vercel detect Next.js automatically

### Step 2: Configure build settings

Recommended settings:

- Framework Preset: `Next.js`
- Root Directory: repo root
- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm build`

Vercel usually detects these automatically, but setting them explicitly is fine.

### Step 3: Add environment variables

Set:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_API_URL`
- `PORTFOLIO_API_BASE_URL`
- `NEXT_PUBLIC_PORTFOLIO_API_BASE_URL`

### Step 4: Set the production branch

Use:

- `main`

### Step 5: Add domains

Add:

- `mydomain.com`
- `www.mydomain.com`

Vercel handles SSL automatically for project domains.

### Step 6: Preview deployments

Vercel will create preview deployments for pull requests and non-production branches.

Important current limitation:

- the backend CORS config still expects explicit origins from `CORS_ORIGIN` or `FRONTEND_URL`
- dynamic Vercel preview URLs are not automatically allowed by the current backend code

Practical consequence:

- UI-only preview testing works
- browser API calls from Vercel preview deployments may fail with CORS unless you relax or refactor backend CORS handling

For first production launch, keep the backend CORS list strict and focus on the production frontend domains.

## 9. Render Backend Deployment

Use Render for `portfolio-app-be`.

### Recommended service type

Create a:

- Render Web Service

Use the native Node.js runtime, not Docker, for the simplest setup.

### Recommended plan choice

For real production traffic, prefer at least a paid starter instance.

Reason:

- Render’s official free-instance docs say free web services are for preview / hobby use and should not be used for production apps
- free web services spin down after 15 minutes without inbound traffic
- free web services do not support one-off jobs or shell access

### Step 1: Import the backend repo

In Render:

1. Create a new Web Service
2. Connect `portfolio-app-be`
3. Choose the production branch, usually `main`

### Step 2: Configure runtime settings

Recommended settings:

- Runtime: `Node`
- Region: as close as possible to Neon
- Auto-Deploy: `On Commit` or `After CI Checks Pass`

### Step 3: Build / start commands

Use:

```bash
Build Command:
corepack enable && corepack prepare pnpm@9 --activate && pnpm install --frozen-lockfile && pnpm prisma migrate deploy && pnpm build
```

```bash
Start Command:
corepack enable && corepack prepare pnpm@9 --activate && pnpm start:prod
```

Notes:

- the repo `render.yaml` keeps `pnpm prisma migrate deploy` inside the build command so the same configuration works on both free and paid Render web services
- free web services do not support `preDeployCommand`
- if you upgrade to a paid plan later, you can move `pnpm prisma migrate deploy` into a `preDeployCommand` for a cleaner rollout model
- do not assume local filesystem state from the running service

### Step 4: Set the health check path

Use:

```text
/api/health
```

The current backend already exposes that endpoint.

### Step 5: Add environment variables

Set:

- `APP_HOST=0.0.0.0`
- `DATABASE_URL`
- JWT variables
- CORS / frontend origin variables (`CORS_ORIGIN` and/or `FRONTEND_URL`)
- R2 variables

Render provides `PORT` automatically. The backend already reads it.

### Step 6: Add the API custom domain

Add:

- `api.mydomain.com`

Render handles TLS automatically for custom domains.

### Step 7: If you intentionally use the Render free instance type

Render’s official behavior for free web services:

- they spin down after 15 minutes with no inbound traffic
- the next request can take about one minute while the service spins back up
- requests to `/robots.txt` do not wake a spun-down service

If you want to reduce cold starts on a hobby deployment, use an external monitor to hit:

- `https://api.mydomain.com/api/health`

Recommended interval:

- every 10 to 14 minutes

#### Option A: UptimeRobot or cron-job.org

This is the simplest reliable option.

1. Create a free UptimeRobot or cron-job.org account
2. Create an HTTP `GET` monitor
3. Set the URL to:

```text
https://api.mydomain.com/api/health
```

4. Set the interval to `10` or `14` minutes
5. Confirm the endpoint returns HTTP `200`

#### Option B: Separate external scheduler

If you prefer code over a dashboard service, use something that runs outside the Render free web service, for example:

- GitHub Actions scheduled workflow
- another always-on worker
- any external cron provider

#### Why an internal `node-cron` self-ping is not reliable here

This is the important correction:

- a cron job running inside the same Render free web service cannot prevent spin-down once the service is already asleep
- when the free service is spun down, that process is not running, so its internal scheduler is not running either

So:

- external traffic works
- self-pinging from inside the sleeping free service does not solve the core problem

The good news is that your backend already exposes the required health endpoint at:

```text
/api/health
```

### Optional `render.yaml`

If you want Render configuration in source control later, start with something like:

```yaml
services:
  - type: web
    name: portfolio-api
    runtime: node
    repo: https://github.com/your-org/portfolio-app-be
    branch: main
    buildCommand: corepack enable && corepack prepare pnpm@9 --activate && pnpm install --frozen-lockfile && pnpm prisma migrate deploy && pnpm build
    startCommand: corepack enable && corepack prepare pnpm@9 --activate && pnpm start:prod
    healthCheckPath: /api/health
    envVars:
      - key: NODE_VERSION
        value: 22
```

If you are on a paid Render plan, an alternative is:

```yaml
services:
  - type: web
    name: portfolio-api
    runtime: node
    branch: main
    buildCommand: corepack enable && corepack prepare pnpm@9 --activate && pnpm install --frozen-lockfile && pnpm build
    preDeployCommand: corepack enable && corepack prepare pnpm@9 --activate && pnpm prisma migrate deploy
    startCommand: corepack enable && corepack prepare pnpm@9 --activate && pnpm start:prod
    healthCheckPath: /api/health
```

## 10. Domains and SSL

You do not need to manage Nginx or Let's Encrypt manually in this deployment model.

### Frontend

Use Vercel domains:

- `mydomain.com`
- `www.mydomain.com`

### Backend

Use Render custom domain:

- `api.mydomain.com`

### Assets

Use Cloudflare R2 custom domain:

- `assets.mydomain.com`

### DNS summary

Point:

- root / `www` frontend records to Vercel
- `api` to Render
- `assets` to the R2 custom domain setup in Cloudflare

Both Vercel and Render provide managed TLS for their custom domains.

## 11. First-Time Deployment Checklist

1. Create the Neon project and database
2. Create the R2 bucket and API credentials
3. Import the frontend repo into Vercel
4. Import the backend repo into Render
5. Add all required environment variables
6. Configure production domains
7. Update DNS records
8. Set Render health check path to `/api/health`
9. Deploy the backend
10. Confirm Prisma migrations ran successfully
11. Run the admin bootstrap command once if needed
12. Deploy the frontend
13. Verify frontend -> backend communication
14. Verify uploads against R2
15. Verify database writes and reads

## 12. First Deployment Verification

Check all of these after the first live deploy:

- Frontend loads at `https://mydomain.com`
- Backend health endpoint responds at `https://api.mydomain.com/api/health`
- Login works
- Admin pages load
- Projects list loads
- Inquiry form submits successfully
- File upload works and files persist
- Uploaded asset URLs load from R2

Expected health response:

```json
{
  "service": "portfolio-api",
  "status": "ok"
}
```

## 13. Update / Redeploy Process

### Frontend changes

When you push to the frontend repo production branch:

1. Vercel builds the new Next.js deployment
2. Vercel updates the production domain after a successful deploy

### Backend changes

When you push to the backend repo production branch:

1. Render builds the backend
2. Render runs `pnpm prisma migrate deploy` during the build command in the repo default setup
3. Render starts the new instance
4. Render checks `/api/health`
5. Render switches traffic after the service is healthy

### Cross-repo release note

Because frontend and backend deploy independently:

- avoid releasing a breaking backend change before the frontend is ready
- prefer additive API changes first
- remove deprecated fields only after the frontend no longer depends on them

## 14. Optional GitHub Actions CI

With Vercel + Render, GitHub Actions does not need to perform SSH deployment anymore.

Use GitHub Actions for quality checks only:

- lint
- typecheck
- test
- build

Then let:

- Vercel deploy from Git
- Render deploy from Git

### Optional backend CI example

`.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      - run: corepack enable
      - run: corepack prepare pnpm@9 --activate
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm exec tsc --noEmit -p tsconfig.json
      - run: pnpm test -- --runInBand
      - run: pnpm build
```

Mirror the same pattern in the frontend repo with:

- `pnpm lint`
- `pnpm exec tsc --noEmit`
- `pnpm build`

If you enable CI checks:

- Render can auto-deploy `After CI Checks Pass`
- Vercel can use deployment checks before promotion

## 15. Backups and Recovery

### Neon

Use Neon’s built-in recovery features first:

- branching
- restore window / point-in-time restore
- snapshots / backup-and-restore features available on your plan

### Optional logical backup

Keep periodic `pg_dump` exports outside Neon as an additional safety layer:

```bash
pg_dump "$DATABASE_URL" -Fc > backup_$(date +%F_%H-%M-%S).dump
```

Restore example:

```bash
pg_restore -d "$DATABASE_URL" --clean --if-exists backup_2026-05-07_12-00-00.dump
```

If your `DATABASE_URL` is not in shell env locally:

```bash
export DATABASE_URL="postgresql://..."
```

### Cloudflare R2

For files:

- keep bucket access restricted
- use object lifecycle rules where useful
- consider a secondary backup or replication strategy for critical assets

## 16. Monitoring and Logs

### Vercel

Use:

- Deployments
- Build logs
- Runtime logs
- Observability

CLI example:

```bash
vercel logs
vercel logs --follow
```

### Render

Use:

- Service logs
- Deploy logs
- Health checks
- Events
- Rollbacks
- One-off job logs

Recommended checks:

- service status is healthy
- `/api/health` is passing
- latest deploy completed successfully
- if you are on the free instance type, confirm your external monitor is hitting the health URL successfully

### Neon

Use the Neon dashboard for:

- branch management
- restore / PITR
- connection details
- usage and compute visibility

## 17. Troubleshooting

### Frontend build fails on Vercel

Check:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_API_URL`
- `PORTFOLIO_API_BASE_URL`
- `NEXT_PUBLIC_PORTFOLIO_API_BASE_URL`
- TypeScript errors
- lint errors

### Frontend cannot reach backend

Check:

- backend is live on Render
- `api.mydomain.com` is configured correctly
- frontend API URL includes `/api`

Correct example:

```env
PORTFOLIO_API_BASE_URL=https://api.mydomain.com/api
NEXT_PUBLIC_PORTFOLIO_API_BASE_URL=https://api.mydomain.com/api
```

### CORS error from Vercel preview deployment

Cause:

- backend CORS currently matches explicit origins from `CORS_ORIGIN` or `FRONTEND_URL`
- Vercel preview URLs are dynamic

Fix options:

1. Keep production domains only and accept that preview browser API tests are limited
2. Refactor backend CORS handling to support preview domains safely
3. Add a staging backend with its own allowed frontend origin list

### Render deploy fails because the app never becomes healthy

Check:

- `APP_HOST=0.0.0.0`
- Render health check path is `/api/health`
- the service is listening on Render’s `PORT`

### Render deploy fails during migration

Check:

- `DATABASE_URL`
- Neon network / credentials
- migration files are committed
- the deploy uses `pnpm prisma migrate deploy`, not `migrate dev`
- if you are on the repo-default free-compatible setup, that command runs inside the Render build command
- if you are on a paid-plan variant, that command can run in `preDeployCommand`

### Backend cannot connect to Neon

Check:

- username
- password
- host
- database name
- `sslmode=require`

### Uploads disappear after deploy

Cause:

- R2 env variables are missing or incomplete, so the backend fell back to local disk
- Render filesystem is ephemeral by default

Proper fix:

- set the full `R2_*` env set so uploads go to Cloudflare R2

### R2 upload fails

Check:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_ENDPOINT`
- `R2_PUBLIC_URL`
- whether the full `R2_*` env set is present in Render

### Custom domain is not serving HTTPS

Check:

- DNS record is pointed at the correct platform
- domain was added inside the correct Vercel or Render project
- certificate issuance has finished

## 18. Security Checklist

- Never commit `.env` files
- Store secrets only in Vercel, Render, Neon, Cloudflare, or GitHub Secrets
- Use strong JWT secrets
- Use a dedicated Neon database user for the app
- Keep the production Neon branch protected
- Restrict R2 credentials to the minimum required access
- Do not expose R2 secret keys to the frontend
- Keep production domains HTTPS-only
- Keep backend CORS restricted to known origins
- Validate MIME types and file size on the backend
- Set the full `R2_*` env set before launch on Render
- Review deploy permissions in GitHub, Vercel, Render, Neon, and Cloudflare

## 19. Final Production Checklist

- [ ] Vercel project is connected to `portfolio-app-fe`
- [ ] Render web service is connected to `portfolio-app-be`
- [ ] Neon production database is created
- [ ] Cloudflare R2 bucket and keys are created
- [ ] Production frontend env vars are set in Vercel
- [ ] Production backend env vars are set in Render
- [ ] `DATABASE_URL` works against Neon with SSL
- [ ] Render health check uses `/api/health`
- [ ] Prisma migrations succeed with `prisma migrate deploy`
- [ ] `mydomain.com` and `www.mydomain.com` point to Vercel
- [ ] `api.mydomain.com` points to Render
- [ ] `assets.mydomain.com` points to Cloudflare R2 custom domain
- [ ] Frontend loads over HTTPS
- [ ] Backend health endpoint returns `ok`
- [ ] Database reads and writes work
- [ ] Inquiry submissions work
- [ ] Admin auth works
- [ ] File uploads persist in R2
- [ ] The full `R2_*` env set is present so local filesystem uploads are not part of the production path
- [ ] Backup and restore procedure is documented and tested

If you use a free Render instance for a hobby deployment:

- [ ] an external monitor pings `https://api.mydomain.com/api/health` every 10 to 14 minutes

## Official References Used

These docs were used to align the guide with the current platform behavior:

- Vercel deployment methods: https://vercel.com/docs/deployments/deployment-methods
- Vercel environments: https://vercel.com/docs/deployments/environments
- Vercel environment variables: https://vercel.com/docs/projects/environment-variables
- Vercel Next.js overview: https://vercel.com/docs/concepts/next.js/overview
- Vercel custom domains: https://vercel.com/docs/domains/working-with-domains/add-a-domain
- Vercel logs: https://vercel.com/docs/observability/logs
- Render web services: https://render.com/docs/web-services
- Render free instance limitations: https://render.com/docs/free
- Render deploy flow and pre-deploy commands: https://render.com/docs/deploys
- Render default env vars: https://render.com/docs/environment-variables
- Render environment variables and secrets: https://render.com/docs/configure-environment-variables
- Render health checks: https://render.com/docs/health-checks
- Render FAQ: https://render.com/docs/faq
- Render custom domains: https://render.com/docs/custom-domains
- Render managed TLS: https://render.com/docs/tls
- Render logs: https://render.com/docs/logging
- Render one-off jobs: https://render.com/docs/one-off-jobs
- Neon connection guide: https://neon.com/docs/get-started-with-neon/connect-neon
- Neon branching and restore windows: https://neon.com/docs/introduction/point-in-time-restore
- Neon Vercel integration overview: https://neon.com/docs/guides/vercel/
- Prisma + Neon reference: https://docs.prisma.io/docs/v6/orm/overview/databases/neon
- Cloudflare R2 overview: https://developers.cloudflare.com/r2/
- Cloudflare R2 create buckets: https://developers.cloudflare.com/r2/buckets/create-buckets/
- Cloudflare R2 public buckets and custom domains: https://developers.cloudflare.com/r2/data-access/public-buckets/
- Cloudflare R2 CORS: https://developers.cloudflare.com/r2/buckets/cors/
