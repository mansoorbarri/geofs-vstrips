-- CreateEnum
CREATE TYPE "public"."FlightStatus" AS ENUM ('delivery', 'ground', 'tower', 'departure', 'approach', 'control');

-- CreateTable
CREATE TABLE "public"."flights" (
    "id" UUID NOT NULL,
    "airport" VARCHAR(10) NOT NULL,
    "callsign" VARCHAR(255) NOT NULL,
    "aircraft_type" VARCHAR(255) NOT NULL,
    "departure" VARCHAR(255) NOT NULL,
    "arrival" VARCHAR(255) NOT NULL,
    "altitude" VARCHAR(255) NOT NULL,
    "speed" VARCHAR(255) NOT NULL,
    "status" "public"."FlightStatus" NOT NULL,
    "notes" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "flights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."flight_history" (
    "id" UUID NOT NULL,
    "flight_id" UUID NOT NULL,
    "old_status" VARCHAR(255) NOT NULL,
    "new_status" VARCHAR(255) NOT NULL,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_by" VARCHAR(255),

    CONSTRAINT "flight_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."flight_history" ADD CONSTRAINT "flight_history_flight_id_fkey" FOREIGN KEY ("flight_id") REFERENCES "public"."flights"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
