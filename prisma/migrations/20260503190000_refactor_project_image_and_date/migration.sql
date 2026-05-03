ALTER TABLE "projects"
RENAME COLUMN "cover_image_url" TO "image_url";

ALTER TABLE "projects"
ADD COLUMN "project_date" TIMESTAMP(3);
