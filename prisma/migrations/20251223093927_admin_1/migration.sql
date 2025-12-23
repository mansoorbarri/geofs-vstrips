-- AlterTable
ALTER TABLE "public"."flights" ADD COLUMN     "deleted_at" TIMESTAMPTZ(6),
ALTER COLUMN "notes" DROP NOT NULL;
