# Backend Construction Steps

This is the recommended construction order for the backend from zero to the current system. It reflects the real feature set now in the repo:

- auth with refresh tokens
- admin-only project and inquiry management
- image uploads
- public project APIs
- normalized multilingual project content

## 1. Bootstrap the NestJS app

Start with a minimal NestJS project and keep the initial surface small:

- `src/main.ts`
- `src/app.module.ts`
- `src/app.controller.ts`
- `src/app.service.ts`

The goal here is only a working app that runs and builds.

## 2. Install the architectural dependencies up front

Core:

```bash
pnpm add @nestjs/config class-validator class-transformer
```

Auth:

```bash
pnpm add @nestjs/jwt @nestjs/passport passport passport-jwt passport-local bcrypt
pnpm add -D @types/passport @types/passport-jwt @types/passport-local @types/bcrypt
```

Database:

```bash
pnpm add @prisma/client @prisma/adapter-pg pg dotenv
pnpm add -D prisma @types/pg
```

Docs and uploads:

```bash
pnpm add @nestjs/swagger swagger-ui-express
```

## 3. Set up local infrastructure before feature work

Create:

- `docker-compose.yml`
- `.env.example`
- `prisma.config.ts`

Use PostgreSQL 16 on `5433` so local machine Postgres is not a blocker.

Recommended local env:

```env
NODE_ENV=development
APP_HOST=0.0.0.0
PORT=3001
FRONTEND_URL=http://localhost:3000
UPLOAD_DIR=uploads
UPLOAD_URL_PREFIX=/uploads
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/portfolio_app?schema=public
JWT_SECRET=replace-this-with-a-long-random-secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=replace-this-with-a-different-long-random-secret
JWT_REFRESH_EXPIRES_IN=30d
```

Start the database as soon as the compose file exists:

```bash
pnpm db:up
```

## 4. Configure global app behavior

Create the application shell before adding modules.

Files:

- `src/setup-app.ts`
- `src/setup-swagger.ts`
- `src/common/validation/validation-exception.factory.ts`

This layer should define:

- global `/api` prefix
- CORS from `FRONTEND_URL`
- global validation
- static serving for uploaded assets
- Swagger in non-production environments

## 5. Define the Prisma schema in stable ownership layers

Add Prisma models in this order:

1. `User`
2. `Project`
3. `Inquiry`
4. `ProjectTranslation`

That keeps the multilingual project design as a refinement on a stable project identity model, not a premature complication.

Current stable content model:

- `projects` stores shared metadata
- `project_translations` stores manual localized content by locale

Important principle:

- never model localized text as `titleEn`, `titleRo`, and similar field proliferation

## 6. Generate Prisma client and create migrations incrementally

After each schema layer:

```bash
pnpm prisma:generate
pnpm prisma:migrate:dev
```

Keep migrations small and explicit. The translation-table change should be its own migration, including backfill from the previous single-language columns.

## 7. Add Prisma to NestJS

Create:

- `src/prisma/prisma.module.ts`
- `src/prisma/prisma.service.ts`

Requirements:

- use `PrismaPg`
- make Prisma globally available inside Nest
- disconnect cleanly

## 8. Build the users layer before auth

Create:

- `src/users/users.module.ts`
- `src/users/users.service.ts`

The users layer should own:

- create user
- find by email
- find by id
- remove password from returned objects
- upsert admin user

## 9. Build authentication

Create:

- `src/auth/auth.module.ts`
- `src/auth/auth.controller.ts`
- `src/auth/auth.service.ts`
- DTOs
- JWT and local strategies
- auth guards
- current-user decorator

The first stable auth surface:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Then extend it with:

- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/admin/me`

Rules:

- hash passwords with `bcrypt`
- store only a hashed refresh token
- rotate refresh tokens

## 10. Add RBAC before admin features

Create:

- `src/auth/decorators/roles.decorator.ts`
- `src/auth/guards/roles.guard.ts`

The admin surface should depend on verified JWT auth first, then role enforcement.

## 11. Add an admin bootstrap CLI

Create:

- `src/scripts/create-admin.ts`

Command:

```bash
pnpm admin:create -- --email admin@example.com --password StrongPass123 --first-name Admin --last-name User
```

This removes any dependency on a pre-existing admin UI for first access.

## 12. Add public project read APIs before admin project writing

Create the public read contract before the admin mutation contract.

Files:

- `src/projects/projects.module.ts`
- `src/projects/projects.controller.ts`
- `src/projects/projects.service.ts`
- read response DTOs

Public reads should support:

- published project list
- published project detail by slug
- optional locale query parameter
- fallback to default locale when the requested translation is missing

This is the contract the SSR frontend consumes.

## 13. Add admin project management

After public reads are stable, add admin write flows:

- create project
- list all projects
- get project by id
- update project
- delete project

Keep the design normalized:

- shared project fields live on `Project`
- localized content is passed as a `translations` array

DTO rules should enforce:

- supported locales only
- unique locale entries
- required default locale content

## 14. Add dedicated project image handling

Do not mix file uploads into the JSON project payload.

Add:

- upload config
- uploads service
- multipart endpoint for `POST /api/admin/projects/:id/image`
- remove endpoint for `DELETE /api/admin/projects/:id/image`

This keeps the project content model and file lifecycle separate.

## 15. Add inquiry intake and inquiry admin tooling

Build the contact flow as its own module:

- public inquiry creation
- admin inquiry inbox
- detail view support
- state transitions such as `NEW`, `IN_REVIEW`, `RESOLVED`, `ARCHIVED`

This work is orthogonal to project content and should remain isolated.

## 16. Add the admin dashboard only after projects and inquiries exist

The dashboard should aggregate existing modules rather than invent its own source of truth.

Current dashboard responsibilities:

- project counts
- inquiry counts
- user counts
- recent projects
- recent users

## 17. Add seed data only after the schema is stable enough

Create or maintain:

- `scripts/seed.sql`

The seed should reflect the real schema of the moment:

- current project table shape
- current translation table shape
- current admin credentials

For the current system, the seed should populate:

- baseline admin user
- shared project metadata
- `en` and `ro` translations for seeded projects

## 18. Add Swagger once the DTOs are real

Document:

- request DTOs
- response DTOs
- bearer auth requirements
- multipart upload endpoints
- locale-aware public project queries

Swagger should describe the actual API contract, not a scaffold guess.

## 19. Keep validation output frontend-friendly

Return field-level validation errors as flattened `path` arrays so the frontend can map them directly into form state.

That matters even more once localized fields become nested, for example:

- `translations.0.title`
- `translations.1.summary`

## 20. Verify after every major layer

Use these checks continuously:

```bash
pnpm build
pnpm test --runInBand
pnpm test:e2e
pnpm prisma:generate
pnpm prisma:studio
```

And for migration-sensitive changes:

```bash
pnpm exec prisma migrate deploy
docker exec -i portfolio-postgres psql -U postgres -d portfolio_app -v ON_ERROR_STOP=1 < scripts/seed.sql
```

## 21. Preserve clear module boundaries

As the system grows, keep ownership obvious:

- `auth` owns identity and tokens
- `users` owns user persistence
- `projects` owns project metadata and translations
- `uploads` owns managed files
- `inquiries` owns contact-form persistence and admin workflow
- `admin` owns cross-module summaries, not raw data duplication

That boundary discipline is what keeps the current feature set scalable.
