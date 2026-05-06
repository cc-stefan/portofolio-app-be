# Portfolio Backend

NestJS 11 backend for the portfolio application. The current backend provides:

- JWT auth with refresh-token rotation and role-based access control
- admin bootstrap CLI for promoting or creating admins
- public inquiry intake and admin inquiry management
- public project listing/detail endpoints
- admin project CRUD with dedicated image upload/remove endpoints
- normalized multilingual project content with manual translations
- Prisma ORM on PostgreSQL
- Swagger docs for the current API surface

For the intended build order from zero to the current system, see [CONSTRUCTION_STEPS.md](/Users/ccs/development/portfolio-app/portfolio-app-be/CONSTRUCTION_STEPS.md).

## Stack

- NestJS
- Prisma
- PostgreSQL 16
- Passport + JWT
- Swagger

## Data model

The stable project model is:

- `projects`: shared project metadata such as `slug`, links, technologies, flags, image URL, and ordering
- `project_translations`: manually maintained localized project content by `(project_id, locale)`
- `users`
- `inquiries`

Supported project locales today:

- `en`
- `ro`

The backend does not do runtime machine translation. Public project endpoints resolve translations manually and fall back to the default locale when the requested locale is missing.

## Local setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create the local env file

```bash
cp .env.example .env
```

Current local env shape:

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

### 3. Start PostgreSQL

```bash
pnpm db:up
```

This starts PostgreSQL 16 on `localhost:5433`.

### 4. Generate Prisma client

```bash
pnpm prisma:generate
```

### 5. Apply migrations

For a local development database:

```bash
pnpm prisma:migrate:dev
```

For an already created database where you want to apply tracked migrations without creating a new one:

```bash
pnpm exec prisma migrate deploy
```

### 6. Seed local data

```bash
docker exec -i portfolio-postgres psql -U postgres -d portfolio_app -v ON_ERROR_STOP=1 < scripts/seed.sql
```

This seeds:

- the baseline admin user
- the published portfolio projects
- `en` and `ro` project translations for the seeded projects

Seeded admin credentials:

- `admin@example.com`
- `Admin123!`

### 7. Start the API

```bash
pnpm start:dev
```

Default local URLs:

- API: `http://localhost:3001/api`
- Swagger UI: `http://localhost:3001/api/docs`

## Scripts

```bash
pnpm start:dev
pnpm build
pnpm test
pnpm test:e2e
pnpm prisma:studio
pnpm db:down
```

Create or promote an admin user:

```bash
pnpm admin:create -- --email admin@example.com --password StrongPass123 --first-name Admin --last-name User
```

## API surface

### Health

- `GET /api/health`

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/auth/admin/me`

### Public inquiries

- `POST /api/inquiries`

### Admin inquiries (`ADMIN`)

- `GET /api/admin/inquiries`
- `GET /api/admin/inquiries/:id`
- `PATCH /api/admin/inquiries/:id`
- `DELETE /api/admin/inquiries/:id`

### Public projects

- `GET /api/projects`
- `GET /api/projects/:slug`

Optional query:

- `locale=en|ro`

Public project responses include:

- localized `title`
- localized `summary`
- localized `description`
- `contentLocale`
- `availableLocales`

### Admin projects (`ADMIN`)

- `POST /api/admin/projects`
- `GET /api/admin/projects`
- `GET /api/admin/projects/:id`
- `PATCH /api/admin/projects/:id`
- `POST /api/admin/projects/:id/image`
- `DELETE /api/admin/projects/:id/image`
- `DELETE /api/admin/projects/:id`

### Admin dashboard (`ADMIN`)

- `GET /api/admin/dashboard`

## Example payloads

### Register

```json
{
  "email": "john@example.com",
  "password": "StrongPass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Login

```json
{
  "email": "admin@example.com",
  "password": "Admin123!"
}
```

### Refresh

```json
{
  "refreshToken": "your-refresh-token"
}
```

### Create inquiry

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "message": "I would like to discuss a frontend contract and a possible long-term collaboration."
}
```

### Update inquiry admin state

```json
{
  "status": "IN_REVIEW",
  "isRead": true,
  "adminNotes": "Followed up and waiting for a reply."
}
```

### Create project

```json
{
  "translations": [
    {
      "locale": "en",
      "title": "Exminds Landing Page",
      "summary": "Conversion-focused marketing site built for performance, localization, and measurable lead generation.",
      "description": "Long-form English project description."
    },
    {
      "locale": "ro",
      "title": "Pagină de prezentare Exminds",
      "summary": "Site de marketing orientat spre conversii, construit pentru performanță, localizare și generare de lead-uri măsurabilă.",
      "description": "Descriere lungă în limba română."
    }
  ],
  "slug": "exminds-landing-page",
  "liveUrl": "https://www.exminds.com/",
  "repositoryUrl": null,
  "projectDate": null,
  "technologies": ["Next.js", "React", "TypeScript"],
  "featured": true,
  "published": true,
  "displayOrder": 1
}
```

Rules:

- `translations` must include `en`
- locales must be unique within the payload
- localized text stays manually authored

### Update project

`PATCH /api/admin/projects/:id` uses the same shape, but fields are optional.

### Upload project image

```bash
curl -X POST http://localhost:3001/api/admin/projects/<project-id>/image \
  -H "Authorization: Bearer <admin-jwt>" \
  -F "file=@./project-image.png"
```

Supported types:

- JPEG
- PNG
- WEBP
- GIF
- AVIF

Maximum file size:

- 5 MB

## Validation errors

The backend uses a global `ValidationPipe` and returns flattened field errors that the frontend can map back to form state.

Example `400` response:

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "path": ["translations", "0", "title"],
      "message": "title must be shorter than or equal to 120 characters"
    },
    {
      "path": ["slug"],
      "message": "slug must match /^[a-z0-9]+(?:-[a-z0-9]+)*$/ regular expression"
    }
  ]
}
```

## Notes

- Uploaded project images are stored locally under `UPLOAD_DIR` and served from `UPLOAD_URL_PREFIX`.
- The seeded projects are intentionally content-managed through the API and admin UI rather than hardcoded in the frontend.
- Public project reads can be localized by query parameter without breaking SSR consumers on the frontend.
