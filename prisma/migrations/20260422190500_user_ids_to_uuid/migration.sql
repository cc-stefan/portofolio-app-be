ALTER TABLE "users" DROP CONSTRAINT "users_pkey";

ALTER TABLE "users"
ALTER COLUMN "id" DROP DEFAULT;

ALTER TABLE "users"
ALTER COLUMN "id" TYPE UUID
USING (
  CASE
    WHEN "id" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      THEN "id"::uuid
    ELSE gen_random_uuid()
  END
);

ALTER TABLE "users"
ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");
