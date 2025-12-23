-- CreateTable
CREATE TABLE "public"."EventSettings" (
    "id" TEXT NOT NULL DEFAULT 'current',
    "eventName" TEXT NOT NULL DEFAULT 'GeoFS Event',
    "departureMode" TEXT NOT NULL DEFAULT 'CUSTOM',
    "fixedDeparture" VARCHAR(4),
    "arrivalMode" TEXT NOT NULL DEFAULT 'CUSTOM',
    "fixedArrival" VARCHAR(4),
    "timeMode" TEXT NOT NULL DEFAULT 'CUSTOM',
    "fixedTime" VARCHAR(4),
    "routeMode" TEXT NOT NULL DEFAULT 'CUSTOM',
    "fixedRoute" TEXT,
    "activeAirports" TEXT[] DEFAULT ARRAY['VGHS']::TEXT[],
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "EventSettings_pkey" PRIMARY KEY ("id")
);
