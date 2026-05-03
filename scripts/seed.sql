-- Seed baseline admin user and CV-backed projects.
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

DELETE FROM "projects"
WHERE
  "id" IN (
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333',
    '44444444-4444-4444-8444-444444444444'
  )
  OR "slug" IN (
    'portfolio-backend-api',
    'portfolio-admin-dashboard',
    'realtime-chat-platform'
  );

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
  'E-Transport Management System',
  'e-transport-management-system',
  'Transport operations interface for planning routes, managing delivery workflows, and tracking financial outcomes.',
  'The product needed to bring route planning, operational tracking, billing, and profit-and-loss reporting into a single interface that teams could use without friction.

I built the frontend with React, TypeScript, and Material UI, structuring the experience around clear workflows, readable data presentation, and UI patterns that reduced complexity for day-to-day use.

The result was a more usable operations surface that connected logistics actions with financial visibility instead of treating them as separate tools.',
  NULL,
  NULL,
  NULL,
  ARRAY['HTML', 'CSS', 'TypeScript', 'React', 'Material UI']::TEXT[],
  FALSE,
  TRUE,
  3,
  NOW(),
  NOW()
),
(
  '33333333-3333-4333-8333-333333333333',
  'HR Management Software',
  'hr-management-software',
  'Internal HR application for managing employee records and everyday administrative workflows.',
  'The application needed to centralize employee data and HR actions in a single web interface that was easier to use than fragmented manual processes.

I built the frontend in React with Material UI and connected it to a Node.js, Express.js, and MongoDB backend through REST APIs, focusing on clear forms, maintainable structure, and predictable user flows.

The result was a practical internal tool that made common HR tasks faster to complete and easier to manage.',
  NULL,
  NULL,
  NULL,
  ARRAY['HTML', 'CSS', 'JavaScript', 'React', 'Material UI', 'REST API', 'Node.js', 'Express.js', 'MongoDB']::TEXT[],
  FALSE,
  TRUE,
  4,
  NOW(),
  NOW()
),
(
  '44444444-4444-4444-8444-444444444444',
  'Exminds Landing Page',
  'exminds-landing-page',
  'Conversion-focused marketing site built for performance, localization, and measurable lead generation.',
  'The site needed to communicate the product clearly, load fast, support multiple locales, and turn traffic into qualified contact and newsletter submissions.

I built the frontend in Next.js, React, and TypeScript from Figma, using server-rendered pages, locale-based routing, structured translations, optimized image delivery, styled-components SSR, and polished responsive interactions.

I also implemented validated lead-generation flows, SMTP and Mailchimp integrations, and analytics through Tag Manager, Google Analytics, and Hotjar, turning the site into a reliable acquisition surface rather than a static brochure.',
  NULL,
  'https://www.exminds.com/',
  NULL,
  ARRAY['Next.js', 'React', 'TypeScript', 'Styled Components', 'Redux', 'Swiper', 'Nodemailer', 'Mailchimp', 'Google Tag Manager', 'Google Analytics', 'Hotjar', 'SEO', 'i18n']::TEXT[],
  TRUE,
  TRUE,
  1,
  NOW(),
  NOW()
),
(
  '55555555-5555-4555-8555-555555555555',
  'Exminds Web Application',
  'exminds-web-application',
  'Production React platform for experience creation, media workflows, and internationalized user journeys.',
  'The application needed to support complex user workflows without sacrificing clarity, responsiveness, or long-term maintainability.

I co-architected the frontend in React and TypeScript with React Router, React Query, Redux Toolkit, and react-i18next, building reusable UI patterns for experience editing, uploads with progress, HLS video playback, and map-based interactions.

Storybook, Sentry, strict typing, and collaborative review habits helped keep the platform reliable as it grew, making it easier to ship product improvements while supporting real user activity.',
  NULL,
  'https://www.app.exminds.com/',
  NULL,
  ARRAY['React', 'TypeScript', 'React Router', 'React Query', 'Redux Toolkit', 'react-i18next', 'HLS.js', 'Leaflet', 'Storybook', 'Sentry']::TEXT[],
  TRUE,
  TRUE,
  2,
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
