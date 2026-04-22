# Portfolio Backend

NestJS backend scaffold for a portfolio app. The current baseline includes:

- validated environment config
- global request validation
- PostgreSQL with Docker Compose
- Prisma ORM
- `User` model
- JWT auth with Passport

## Step 1: Install dependencies

```bash
pnpm install
```

## Step 2: Create your local env file

```bash
cp .env.example .env
```

Update `JWT_SECRET` before using the API outside local development.

## Step 3: Start PostgreSQL

```bash
pnpm db:up
```

This starts a PostgreSQL 16 container on `localhost:5433`.

## Step 4: Generate the Prisma client

```bash
pnpm prisma:generate
```

## Step 5: Run the first migration

```bash
pnpm prisma:migrate:dev --name init
```

This creates the `users` table defined in [prisma/schema.prisma](/Users/ccs/development/portofolio-app/portofolio-app-be/prisma/schema.prisma).

## Step 6: Start the API

```bash
pnpm start:dev
```

The API listens on `http://localhost:3001` and uses the global prefix `/api`.
Swagger UI is available at `http://localhost:3001/api/docs`.

## Available routes

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
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

1. Add refresh tokens and logout flow.
2. Add a `Project` module for portfolio entries.
3. Add file upload support for project images.
4. Add role-based guards if you want an admin dashboard.
