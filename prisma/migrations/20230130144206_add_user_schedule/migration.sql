/*
  Warnings:

  - You are about to drop the column `username` on the `schedule` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "schedule" DROP CONSTRAINT "schedule_username_fkey";

-- AlterTable
ALTER TABLE "schedule" DROP COLUMN "username";

-- CreateTable
CREATE TABLE "user_schedule" (
    "schedule_id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "shared" BOOLEAN NOT NULL DEFAULT false,
    "shared_by_username" TEXT,

    CONSTRAINT "user_schedule_pkey" PRIMARY KEY ("schedule_id","username")
);

-- AddForeignKey
ALTER TABLE "user_schedule" ADD CONSTRAINT "user_schedule_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_schedule" ADD CONSTRAINT "user_schedule_username_fkey" FOREIGN KEY ("username") REFERENCES "user"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_schedule" ADD CONSTRAINT "user_schedule_shared_by_username_fkey" FOREIGN KEY ("shared_by_username") REFERENCES "user"("username") ON DELETE SET NULL ON UPDATE CASCADE;
