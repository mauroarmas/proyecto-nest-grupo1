/*
  Warnings:

  - You are about to drop the column `notifiedAt` on the `CartLine` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Cart" ADD COLUMN     "notifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CartLine" DROP COLUMN "notifiedAt";
