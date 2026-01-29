/*
  Warnings:

  - You are about to drop the column `approved` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `rejected` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "approved",
DROP COLUMN "rejected",
ADD COLUMN     "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING';
