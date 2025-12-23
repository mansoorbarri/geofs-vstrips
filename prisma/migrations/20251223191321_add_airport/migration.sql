-- AlterTable
ALTER TABLE "public"."EventSettings" ADD COLUMN     "airportMode" TEXT NOT NULL DEFAULT 'CUSTOM',
ADD COLUMN     "fixedAirport" VARCHAR(4);
