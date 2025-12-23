-- AlterTable
ALTER TABLE "public"."EventSettings" ADD COLUMN     "airportData" JSONB NOT NULL DEFAULT '[]',
ALTER COLUMN "activeAirports" SET DEFAULT ARRAY[]::TEXT[];
