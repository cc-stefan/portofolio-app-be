CREATE TABLE "project_translations" (
    "project_id" UUID NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "project_translations_pkey" PRIMARY KEY ("project_id","locale"),
    CONSTRAINT "project_translations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "project_translations" ("project_id", "locale", "title", "summary", "description")
SELECT "id", 'en', "title", "summary", "description"
FROM "projects";

ALTER TABLE "projects"
DROP COLUMN "title",
DROP COLUMN "summary",
DROP COLUMN "description";

CREATE INDEX "project_translations_locale_idx" ON "project_translations"("locale");
