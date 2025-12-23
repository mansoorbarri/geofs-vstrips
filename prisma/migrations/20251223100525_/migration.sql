/*
  Warnings:

  - You are about to drop the column `eventName` on the `EventSettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."EventSettings" DROP COLUMN "eventName",
ADD COLUMN     "isEventLive" BOOLEAN NOT NULL DEFAULT false;
