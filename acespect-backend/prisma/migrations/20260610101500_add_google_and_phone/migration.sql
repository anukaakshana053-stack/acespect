-- Make local password optional (Google-only accounts have none)
ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- New profile / identity columns
ALTER TABLE "users" ADD COLUMN "phone" TEXT;
ALTER TABLE "users" ADD COLUMN "googleId" TEXT;
ALTER TABLE "users" ADD COLUMN "avatarUrl" TEXT;

-- One Google identity per user (nullable: multiple NULLs allowed in Postgres)
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
