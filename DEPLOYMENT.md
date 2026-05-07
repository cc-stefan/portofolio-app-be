# Deployment Guide

This guide deploys the backend first, without a custom domain.

Production URL format for now:

- `https://<your-render-service>.onrender.com`
- API base URL: `https://<your-render-service>.onrender.com/api`

Stack used here:

- Render for the NestJS API
- Neon for PostgreSQL
- Optional Cloudflare R2 for image uploads

## 1. What You Need

Before you start:

1. Push this repo to GitHub.
2. Create a Render account.
3. Create a Neon account.
4. If you need persistent image uploads in production, create a Cloudflare R2 bucket too.

## 2. Create the Database in Neon

1. In Neon, create a new project.
2. Create or use the default database.
3. Copy the connection string.
4. Make sure it includes `sslmode=require`.

Example:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB_NAME?sslmode=require
```

## 3. Create the Render Web Service

1. In Render, click `New +`.
2. Choose `Web Service`.
3. Connect your GitHub repo.
4. Select this backend repo.
5. Use these settings:

```text
Name: portfolio-api
Runtime: Node
Branch: main
Build Command: corepack enable && corepack prepare pnpm@9 --activate && pnpm install --frozen-lockfile && pnpm prisma migrate deploy && pnpm build
Start Command: corepack enable && corepack prepare pnpm@9 --activate && pnpm start:prod
Health Check Path: /api/health
```

6. Leave `PORT` unset. Render provides it automatically.
7. Create the service.

## 4. Add Environment Variables in Render

Open the Render service, then add these environment variables.

Required:

```env
NODE_ENV=production
APP_HOST=0.0.0.0
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB_NAME?sslmode=require
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=replace-with-a-different-long-random-secret
JWT_REFRESH_EXPIRES_IN=30d
```

For CORS, use one of these options:

If the frontend is not deployed yet:

```env
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

If the frontend is already deployed without a custom domain, use its platform URL instead:

```env
CORS_ORIGIN=https://<your-frontend>.vercel.app
FRONTEND_URL=https://<your-frontend>.vercel.app
```

Later, when you get a real domain, replace these values with that domain.

## 5. Optional: Configure R2 for Uploads

If you want uploaded images to persist in production, add:

```env
R2_ACCOUNT_ID=replace-me
R2_ACCESS_KEY_ID=replace-me
R2_SECRET_ACCESS_KEY=replace-me
R2_BUCKET_NAME=replace-me
R2_PUBLIC_URL=https://replace-me
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

If you skip R2:

- uploads will use the local `uploads/` folder
- that is fine for temporary testing
- it is not reliable for long-term production storage on Render

## 6. Deploy

1. Save the environment variables in Render.
2. Trigger a deploy if Render does not redeploy automatically.
3. Wait for the build to finish.

During deploy, Render will:

1. install dependencies
2. run `pnpm prisma migrate deploy`
3. build the NestJS app
4. start the API with `pnpm start:prod`

## 7. Verify the Deployment

After the deploy finishes:

1. Open your Render service URL.
2. Check the health endpoint:

```text
https://<your-render-service>.onrender.com/api/health
```

You should get a success response from the API.

Notes:

- Swagger is disabled in production in the current codebase
- the main production check is `/api/health`

## 8. Deploy the Frontend on Vercel

1. In Vercel, click `Add New`.
2. Choose `Project`.
3. Import the frontend repo.
4. Let Vercel detect `Next.js`.
5. Add these environment variables:

```env
NEXT_PUBLIC_PORTFOLIO_API_BASE_URL=https://<your-render-service>.onrender.com/api
NEXT_PUBLIC_SITE_URL=https://<your-vercel-project>.vercel.app
```

6. Deploy the project.
7. Copy the Vercel production URL after deploy finishes.

Important:

- do not use `localhost` values in Vercel
- for the current frontend, these two envs are enough
- you do not need `PORTFOLIO_API_BASE_URL` or `NEXT_PUBLIC_API_URL` in Vercel for this setup

## 9. Update Backend CORS After Frontend Deploy

Once the frontend has a real Vercel URL, go back to Render and set:

```env
CORS_ORIGIN=https://<your-vercel-project>.vercel.app
FRONTEND_URL=https://<your-vercel-project>.vercel.app
```

Then redeploy the backend.

## 10. Verify Frontend and Backend Together

1. Open the Vercel URL.
2. Confirm the homepage loads.
3. Confirm projects load from the backend.
4. Confirm the admin login page opens.
5. Confirm the inquiry form works if you use it.

If API calls fail in the browser, the first thing to check is `CORS_ORIGIN`.

## 11. Later, When You Add a Custom Domain

When you buy a domain later, you only need to update:

1. the Render custom domain settings
2. frontend environment variables
3. `CORS_ORIGIN`
4. `FRONTEND_URL`
5. `R2_PUBLIC_URL` if you serve uploads from your own asset domain

The backend deployment itself does not need a different build process.
