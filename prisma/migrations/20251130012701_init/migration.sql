-- CreateEnum
CREATE TYPE "public"."FlightStatus" AS ENUM ('delivery', 'ground', 'tower', 'departure', 'approach', 'control');

-- CreateTable
CREATE TABLE "public"."flights" (
    "id" UUID NOT NULL,
    "airport" VARCHAR(4) NOT NULL,
    "callsign" VARCHAR(7) NOT NULL,
    "discord_username" VARCHAR(32),
    "geofs_callsign" VARCHAR(24),
    "aircraft_type" VARCHAR(5) NOT NULL,
    "departure" VARCHAR(4) NOT NULL,
    "departure_time" VARCHAR(4) NOT NULL,
    "arrival" VARCHAR(4) NOT NULL,
    "altitude" VARCHAR(5) NOT NULL,
    "squawk" VARCHAR(4) NOT NULL,
    "speed" VARCHAR(4) NOT NULL,
    "status" "public"."FlightStatus" NOT NULL,
    "route" TEXT,
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

-- CreateIndex
CREATE UNIQUE INDEX "flights_callsign_key" ON "public"."flights"("callsign");

-- AddForeignKey
ALTER TABLE "public"."flight_history" ADD CONSTRAINT "flight_history_flight_id_fkey" FOREIGN KEY ("flight_id") REFERENCES "public"."flights"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
