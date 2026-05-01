# Portfolio Backend

NestJS backend scaffold for a portfolio app. The current baseline includes:

- validated environment config
- global request validation
- PostgreSQL with Docker Compose
- Prisma ORM
- `User`, `Project`, and `Inquiry` models
- JWT auth with Passport and refresh tokens
- public inquiry intake for the portfolio contact form
- admin inquiry inbox endpoints

For the ideal backend build order from zero to the current baseline, see [CONSTRUCTION_STEPS.md](/Users/ccs/development/portfolio/portfolio-app-be/CONSTRUCTION_STEPS.md).

## Step 1: Install dependencies

```bash
pnpm install
```

## Step 2: Create your local env file

```bash
cp .env.example .env
```

Set both `JWT_SECRET` and `JWT_REFRESH_SECRET` to strong random values outside local development.
Uploaded project images are stored locally under `UPLOAD_DIR` and served from `UPLOAD_URL_PREFIX`.

## Step 3: Start PostgreSQL

```bash
pnpm db:up
```

This starts a PostgreSQL 16 container on `localhost:5433`.

## Step 4: Generate the Prisma client

```bash
pnpm prisma:generate
```

## Step 5: Run the database migrations

```bash
pnpm exec prisma migrate dev
```

This applies the tracked migrations for the `users`, `projects`, and `inquiries` tables and the `InquiryStatus` enum defined in [prisma/schema.prisma](/Users/ccs/development/portfolio/portfolio-app-be/prisma/schema.prisma).

## Step 6: Start the API

```bash
pnpm start:dev
```

The API listens on `http://localhost:3001` and uses the global prefix `/api`.
Swagger UI is available at [http://localhost:3001/api/docs](http://localhost:3001/api/docs).

## Available routes

- `GET /api/health`
- `POST /api/inquiries`
- `GET /api/admin/inquiries` (`ADMIN`)
- `GET /api/admin/inquiries/:id` (`ADMIN`)
- `PATCH /api/admin/inquiries/:id` (`ADMIN`)
- `DELETE /api/admin/inquiries/:id` (`ADMIN`)
- `GET /api/admin/dashboard` (`ADMIN`)
- `GET /api/projects`
- `GET /api/projects/:slug`
- `POST /api/admin/projects` (`ADMIN`)
- `GET /api/admin/projects` (`ADMIN`)
- `GET /api/admin/projects/:id` (`ADMIN`)
- `PATCH /api/admin/projects/:id` (`ADMIN`)
- `POST /api/admin/projects/:id/cover-image` (`ADMIN`, multipart form-data)
- `DELETE /api/admin/projects/:id/cover-image` (`ADMIN`)
- `DELETE /api/admin/projects/:id` (`ADMIN`)
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/auth/admin/me`

## Example payloads

Register:

```json
{
  "email": "john@example.com",
  "password": "StrongPass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

Login:

```json
{
  "email": "john@example.com",
  "password": "StrongPass123"
}
```

Refresh:

```json
{
  "refreshToken": "your-refresh-token"
}
```

Create inquiry:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "message": "I would like to discuss a backend-focused role and a potential contract engagement."
}
```

Update inquiry admin state:

```json
{
  "status": "IN_REVIEW",
  "isRead": true,
  "adminNotes": "Followed up and waiting for a reply."
}
```

Create project:

```json
{
  "title": "Portfolio Backend",
  "summary": "NestJS backend with Prisma, JWT auth, and admin-managed projects.",
  "description": "A backend API for a portfolio app with public project listing endpoints and admin CRUD.",
  "coverImageUrl": "https://cdn.example.com/projects/portfolio-backend-cover.jpg",
  "liveUrl": "https://portfolio.example.com",
  "repositoryUrl": "https://github.com/example/portfolio-backend",
  "technologies": ["NestJS", "Prisma", "PostgreSQL"],
  "featured": true,
  "published": true,
  "displayOrder": 1
}
```

Upload project cover image:

```bash
curl -X POST http://localhost:3001/api/admin/projects/<project-id>/cover-image \
  -H "Authorization: Bearer <admin-jwt>" \
  -F "file=@./cover-image.png"
```

Supported image types: JPEG, PNG, WEBP, GIF, and AVIF. Maximum upload size: 5 MB.

## Validation errors

Request validation uses the global NestJS validation pipe with field-level error output that maps cleanly back to frontend form fields.

Example `400` response:

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "path": ["email"],
      "message": "email must be an email"
    },
    {
      "path": ["message"],
      "message": "message must be longer than or equal to 24 characters"
    }
  ]
}
```

## Useful commands

```bash
pnpm test
pnpm test:e2e
pnpm prisma:studio
pnpm db:down
```

Create or promote an admin user:

```bash
pnpm admin:create -- --email admin@example.com --password StrongPass123 --first-name Admin --last-name User
```

The command upserts a user with the `ADMIN` role. Public registration still creates only `USER` accounts.

## Suggested next backend steps

1. Add deployment configuration.
