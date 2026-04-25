-- Seed baseline admin user and example projects.
-- Admin login: admin@example.com / Admin123!

BEGIN;

INSERT INTO "users" (
  "id",
  "email",
  "password",
  "refresh_token",
  "first_name",
  "last_name",
  "role",
  "created_at",
  "updated_at"
)
VALUES (
  '11111111-1111-4111-8111-111111111111',
  'admin@example.com',
  '$2b$10$GaChg/uqFl5zdPhVM7mEeuw47S4Fv3/8NtP4Oex8QrgvmHx.ObIHK',
  NULL,
  'Admin',
  'User',
  'ADMIN'::"UserRole",
  NOW(),
  NOW()
)
ON CONFLICT ("email") DO UPDATE
SET
  "password" = EXCLUDED."password",
  "first_name" = EXCLUDED."first_name",
  "last_name" = EXCLUDED."last_name",
  "role" = 'ADMIN'::"UserRole",
  "updated_at" = NOW();

INSERT INTO "projects" (
  "id",
  "title",
  "slug",
  "summary",
  "description",
  "cover_image_url",
  "live_url",
  "repository_url",
  "technologies",
  "featured",
  "published",
  "display_order",
  "created_at",
  "updated_at"
)
VALUES
(
  '22222222-2222-4222-8222-222222222222',
  'Portfolio Backend API',
  'portfolio-backend-api',
  'NestJS backend for a portfolio app with JWT auth and Prisma.',
  'Backend API with admin project management, auth flows, and PostgreSQL persistence.',
  NULL,
  'https://api.example.com',
  'https://github.com/example/portfolio-backend-api',
  ARRAY['NestJS', 'Prisma', 'PostgreSQL', 'TypeScript']::TEXT[],
  TRUE,
  TRUE,
  1,
  NOW(),
  NOW()
),
(
  '33333333-3333-4333-8333-333333333333',
  'Portfolio Admin Dashboard',
  'portfolio-admin-dashboard',
  'Admin dashboard for managing portfolio content.',
  'Internal dashboard for creating, editing, publishing, and ordering portfolio projects.',
  NULL,
  'https://admin.example.com',
  'https://github.com/example/portfolio-admin-dashboard',
  ARRAY['React', 'TypeScript', 'REST API']::TEXT[],
  TRUE,
  TRUE,
  2,
  NOW(),
  NOW()
),
(
  '44444444-4444-4444-8444-444444444444',
  'Realtime Chat Platform',
  'realtime-chat-platform',
  'Realtime messaging app with channels and presence.',
  'Chat platform supporting live messaging, typing indicators, and online presence tracking.',
  NULL,
  'https://chat.example.com',
  'https://github.com/example/realtime-chat-platform',
  ARRAY['Node.js', 'WebSocket', 'PostgreSQL']::TEXT[],
  FALSE,
  TRUE,
  3,
  NOW(),
  NOW()
)
ON CONFLICT ("slug") DO UPDATE
SET
  "title" = EXCLUDED."title",
  "summary" = EXCLUDED."summary",
  "description" = EXCLUDED."description",
  "cover_image_url" = EXCLUDED."cover_image_url",
  "live_url" = EXCLUDED."live_url",
  "repository_url" = EXCLUDED."repository_url",
  "technologies" = EXCLUDED."technologies",
  "featured" = EXCLUDED."featured",
  "published" = EXCLUDED."published",
  "display_order" = EXCLUDED."display_order",
  "updated_at" = NOW();

COMMIT;
