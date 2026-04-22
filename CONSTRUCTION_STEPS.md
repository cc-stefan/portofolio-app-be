# Backend Construction Steps

This is the clean construction order for this backend from zero to the current baseline. It is the recommended sequence, without the false starts or corrective steps.

## 1. Bootstrap the NestJS project

Start with a plain NestJS app using `pnpm`.

```bash
pnpm create nestjs portofolio-app-be
```

Keep the initial structure small:

- `src/main.ts`
- `src/app.module.ts`
- `src/app.controller.ts`
- `src/app.service.ts`

The goal at this stage is only to have a working Nest application that can build and run.

## 2. Install the backend foundation packages

Add the packages that define the architecture before writing feature code.

Core application packages:

```bash
pnpm add @nestjs/config class-validator class-transformer
```

Authentication packages:

```bash
pnpm add @nestjs/jwt @nestjs/passport passport passport-jwt passport-local bcrypt
pnpm add -D @types/passport @types/passport-jwt @types/passport-local @types/bcrypt
```

Database packages:

```bash
pnpm add @prisma/client @prisma/adapter-pg pg dotenv
pnpm add -D prisma @types/pg
```

Documentation packages:

```bash
pnpm add @nestjs/swagger swagger-ui-express
```

## 3. Set up local infrastructure first

Create the local database setup before adding application data access.

Files to add:

- `docker-compose.yml`
- `.env.example`
- `.env`
- `prisma.config.ts`

Use PostgreSQL 16 in Docker and expose it on `5433` to avoid conflicts with a machine-local PostgreSQL instance.

Recommended environment values:

```env
NODE_ENV=development
APP_HOST=0.0.0.0
PORT=3001
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/portfolio_app?schema=public
JWT_SECRET=replace-this-with-a-long-random-secret
JWT_EXPIRES_IN=7d
```

Start the database immediately after creating the compose file:

```bash
pnpm db:up
```

## 4. Configure global application behavior

Create the global bootstrap behavior before adding modules.

Files to add:

- `src/setup-app.ts`
- `src/common/config/env.validation.ts`

This layer should handle:

- global `/api` prefix
- CORS using `FRONTEND_URL`
- global `ValidationPipe`
- environment validation with sensible defaults

Then wire `ConfigModule.forRoot()` into `AppModule`.

## 5. Define the database contract in Prisma

Create the Prisma schema before writing services.

The first stable schema should contain:

- `UserRole` enum with only `USER` and `ADMIN`
- `User` model
- UUID primary key
- email uniqueness
- hashed password storage
- optional first and last name
- timestamps

Recommended model:

```prisma
enum UserRole {
  USER
  ADMIN
}

model User {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email     String   @unique
  password  String
  firstName String?  @map("first_name")
  lastName  String?  @map("last_name")
  role      UserRole @default(USER)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("users")
}
```

## 6. Generate the Prisma client and create the first migration

After the schema is defined, generate the client and create the initial migration.

```bash
pnpm prisma:generate
pnpm prisma:migrate:dev --name init
```

At this point the database becomes the source of truth for the initial structure.

## 7. Add Prisma to NestJS

Create a dedicated Prisma integration layer.

Files to add:

- `src/prisma/prisma.module.ts`
- `src/prisma/prisma.service.ts`

Requirements:

- use `PrismaPg` from `@prisma/adapter-pg`
- keep Prisma global inside Nest
- disconnect cleanly on module destroy

This gives every module a stable database access point.

## 8. Build the users layer before auth

Create the users service before the auth service, because auth depends on user persistence.

Files to add:

- `src/users/users.module.ts`
- `src/users/users.service.ts`

The users layer should support:

- create user
- find by email
- find by id
- remove password from returned API objects
- upsert admin user

Registration should default to `USER`. Admin creation should be explicit.

## 9. Build authentication

After the users layer exists, add the auth module.

Files to add:

- `src/auth/auth.module.ts`
- `src/auth/auth.controller.ts`
- `src/auth/auth.service.ts`
- `src/auth/dto/register.dto.ts`
- `src/auth/dto/login.dto.ts`
- `src/auth/interfaces/jwt-payload.interface.ts`
- `src/auth/strategies/local.strategy.ts`
- `src/auth/strategies/jwt.strategy.ts`
- `src/auth/guards/local-auth.guard.ts`
- `src/auth/guards/jwt-auth.guard.ts`
- `src/auth/decorators/current-user.decorator.ts`

Initial API surface:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Rules:

- hash passwords with `bcrypt`
- never expose the password field in responses
- sign JWTs with `JWT_SECRET`
- keep registration public
- keep login credential-based

## 10. Add role-based access control

Once JWT auth works, add RBAC.

Files to add:

- `src/auth/decorators/roles.decorator.ts`
- `src/auth/guards/roles.guard.ts`

Apply roles only after JWT authentication is in place.

The first protected admin route should be:

- `GET /api/auth/admin/me`

This verifies that:

- the JWT contains the role
- the guard reads metadata correctly
- `ADMIN` access is enforced

## 11. Add refresh token rotation and logout

After access-token auth works, add refresh-token lifecycle management.

Requirements:

- store only a hashed refresh token in the database
- issue both `accessToken` and `refreshToken` on register and login
- add a `POST /api/auth/refresh` endpoint
- rotate the refresh token on every refresh
- add a `POST /api/auth/logout` endpoint that clears the stored refresh token hash

This keeps the token flow production-oriented without requiring cookies yet.

## 12. Add an admin bootstrap command

Create a CLI command to create or promote an admin user without relying on a pre-existing admin UI.

File to add:

- `src/scripts/create-admin.ts`

Script command:

```bash
pnpm admin:create -- --email admin@example.com --password StrongPass123 --first-name Admin --last-name User
```

This command should:

- create the user if it does not exist
- update the user if it already exists
- force the role to `ADMIN`
- hash the provided password

## 13. Add Swagger only after the API surface is stable enough

Wire Swagger after the current routes and DTOs exist.

Files to add:

- `src/setup-swagger.ts`
- Swagger response DTOs for documented endpoints

Expose:

- Swagger UI at `/api/docs`
- OpenAPI JSON at `/api/docs-json`

Annotate:

- controllers with tags
- request DTOs
- bearer-auth protected routes
- response DTOs

This gives a usable API contract instead of a partial skeleton.

## 14. Keep the build output clean

Use a dedicated Nest build config for application code only.

In `tsconfig.build.json`:

- set `rootDir` to `./src`
- include only `src/**/*.ts`
- write `tsBuildInfoFile` into `./dist/tsconfig.build.tsbuildinfo`

This keeps:

- source in `src/`
- compiled output in `dist/`
- watch mode consistent

## 15. Verify every stage before moving on

After each major layer, run the validation commands:

```bash
pnpm exec eslint "src/**/*.ts" "test/**/*.ts"
pnpm build
pnpm exec jest --runInBand
pnpm exec jest --config ./test/jest-e2e.json --runInBand
```

This keeps the project stable while the architecture grows.

## 16. Current baseline complete

At the end of this sequence, the backend should have:

- NestJS application bootstrap
- validated env configuration
- PostgreSQL in Docker
- Prisma 7 configured correctly
- UUID user IDs
- JWT auth
- refresh-token rotation and logout
- `USER` and `ADMIN` roles
- role-based guards
- admin bootstrap script
- Swagger docs

## 17. Next ideal construction order after this point

The next clean sequence should be:

1. Refresh token flow.
2. Admin module for dashboard operations.
3. Project module for portfolio entries.
4. File upload support for assets.
5. Deployment configuration.
