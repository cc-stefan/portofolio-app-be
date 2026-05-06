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
  "slug" IN (
    'portfolio-backend-api',
    'portfolio-admin-dashboard',
    'realtime-chat-platform'
  );

INSERT INTO "projects" (
  "id",
  "slug",
  "image_url",
  "live_url",
  "repository_url",
  "project_date",
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
  'e-transport-management-system',
  NULL,
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
  'hr-management-software',
  NULL,
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
  'exminds-landing-page',
  NULL,
  'https://www.exminds.com/',
  NULL,
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
  'exminds-web-application',
  NULL,
  'https://www.app.exminds.com/',
  NULL,
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
  "live_url" = EXCLUDED."live_url",
  "repository_url" = EXCLUDED."repository_url",
  "project_date" = EXCLUDED."project_date",
  "technologies" = EXCLUDED."technologies",
  "featured" = EXCLUDED."featured",
  "published" = EXCLUDED."published",
  "display_order" = EXCLUDED."display_order",
  "image_url" = COALESCE(EXCLUDED."image_url", "projects"."image_url"),
  "updated_at" = NOW();

INSERT INTO "project_translations" (
  "project_id",
  "locale",
  "title",
  "summary",
  "description"
)
VALUES
(
  '22222222-2222-4222-8222-222222222222',
  'en',
  'E-Transport Management System',
  'Transport operations interface for planning routes, managing delivery workflows, and tracking financial outcomes.',
  'The product needed to bring route planning, operational tracking, billing, and profit-and-loss reporting into a single interface that teams could use without friction.

I built the frontend with React, TypeScript, and Material UI, structuring the experience around clear workflows, readable data presentation, and UI patterns that reduced complexity for day-to-day use.

The result was a more usable operations surface that connected logistics actions with financial visibility instead of treating them as separate tools.'
),
(
  '22222222-2222-4222-8222-222222222222',
  'ro',
  'Sistem de management E-Transport',
  'Interfață operațională pentru planificarea rutelor, gestionarea fluxurilor de livrare și urmărirea rezultatelor financiare.',
  'Produsul trebuia să aducă planificarea rutelor, urmărirea operațională, facturarea și raportarea profitului și pierderii într-o singură interfață pe care echipele să o poată folosi fără fricțiuni.

Am construit frontend-ul cu React, TypeScript și Material UI, structurând experiența în jurul unor fluxuri clare, al unei prezentări ușor de parcurs și al unor pattern-uri UI care au redus complexitatea din utilizarea zilnică.

Rezultatul a fost o suprafață operațională mai ușor de folosit, care conectează acțiunile logistice cu vizibilitatea financiară, în loc să le trateze ca instrumente separate.'
),
(
  '33333333-3333-4333-8333-333333333333',
  'en',
  'HR Management Software',
  'Internal HR application for managing employee records and everyday administrative workflows.',
  'The application needed to centralize employee data and HR actions in a single web interface that was easier to use than fragmented manual processes.

I built the frontend in React with Material UI and connected it to a Node.js, Express.js, and MongoDB backend through REST APIs, focusing on clear forms, maintainable structure, and predictable user flows.

The result was a practical internal tool that made common HR tasks faster to complete and easier to manage.'
),
(
  '33333333-3333-4333-8333-333333333333',
  'ro',
  'Software de management HR',
  'Aplicație internă de resurse umane pentru administrarea datelor angajaților și a fluxurilor administrative de zi cu zi.',
  'Aplicația trebuia să centralizeze datele angajaților și acțiunile de HR într-o singură interfață web, mai ușor de folosit decât procesele manuale fragmentate.

Am construit frontend-ul în React cu Material UI și l-am conectat la un backend Node.js, Express.js și MongoDB prin REST APIs, cu accent pe formulare clare, structură ușor de întreținut și fluxuri previzibile pentru utilizatori.

Rezultatul a fost un instrument intern practic, care a făcut sarcinile HR uzuale mai rapide și mai ușor de administrat.'
),
(
  '44444444-4444-4444-8444-444444444444',
  'en',
  'Exminds Landing Page',
  'Conversion-focused marketing site built for performance, localization, and measurable lead generation.',
  'The site needed to communicate the product clearly, load fast, support multiple locales, and turn traffic into qualified contact and newsletter submissions.

I built the frontend in Next.js, React, and TypeScript from Figma, using server-rendered pages, locale-based routing, structured translations, optimized image delivery, styled-components SSR, and polished responsive interactions.

I also implemented validated lead-generation flows, SMTP and Mailchimp integrations, and analytics through Tag Manager, Google Analytics, and Hotjar, turning the site into a reliable acquisition surface rather than a static brochure.'
),
(
  '44444444-4444-4444-8444-444444444444',
  'ro',
  'Pagină de prezentare Exminds',
  'Site de marketing orientat spre conversii, construit pentru performanță, localizare și generare de lead-uri măsurabilă.',
  'Site-ul trebuia să comunice clar produsul, să se încarce rapid, să suporte mai multe limbi și să transforme traficul în cereri de contact și abonări la newsletter cu valoare reală.

Am construit frontend-ul în Next.js, React și TypeScript pornind din Figma, folosind pagini randate pe server, rutare pe bază de locale, traduceri structurate, livrare optimizată de imagini, styled-components cu SSR și interacțiuni responsive bine finisate.

Am implementat și fluxuri validate de generare de lead-uri, integrări SMTP și Mailchimp, precum și analytics prin Tag Manager, Google Analytics și Hotjar, transformând site-ul într-o suprafață de achiziție fiabilă, nu doar într-o broșură statică.'
),
(
  '55555555-5555-4555-8555-555555555555',
  'en',
  'Exminds Web Application',
  'Production React platform for experience creation, media workflows, and internationalized user journeys.',
  'The application needed to support complex user workflows without sacrificing clarity, responsiveness, or long-term maintainability.

I co-architected the frontend in React and TypeScript with React Router, React Query, Redux Toolkit, and react-i18next, building reusable UI patterns for experience editing, uploads with progress, HLS video playback, and map-based interactions.

Storybook, Sentry, strict typing, and collaborative review habits helped keep the platform reliable as it grew, making it easier to ship product improvements while supporting real user activity.'
),
(
  '55555555-5555-4555-8555-555555555555',
  'ro',
  'Aplicație web Exminds',
  'Platformă React de producție pentru crearea de experiențe, fluxuri media și parcursuri internaționalizate pentru utilizatori.',
  'Aplicația trebuia să susțină fluxuri complexe de utilizare fără să sacrifice claritatea, răspunsul rapid al interfeței sau mentenabilitatea pe termen lung.

Am co-arhitectat frontend-ul în React și TypeScript cu React Router, React Query, Redux Toolkit și react-i18next, construind pattern-uri UI reutilizabile pentru editarea experiențelor, upload-uri cu progres, redare video HLS și interacțiuni pe hartă.

Storybook, Sentry, tiparea strictă și disciplina de review colaborativ au ajutat platforma să rămână fiabilă pe măsură ce a crescut, făcând mai ușoară livrarea de îmbunătățiri de produs în timp ce susținea activitate reală din partea utilizatorilor.'
)
ON CONFLICT ("project_id", "locale") DO UPDATE
SET
  "title" = EXCLUDED."title",
  "summary" = EXCLUDED."summary",
  "description" = EXCLUDED."description";

COMMIT;
