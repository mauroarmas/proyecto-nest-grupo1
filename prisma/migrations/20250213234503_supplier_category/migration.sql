/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Supplier` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Supplier" DROP CONSTRAINT "Supplier_categoryId_fkey";

-- AlterTable
ALTER TABLE "Supplier" DROP COLUMN "categoryId";

-- CreateTable
CREATE TABLE "CategorySupplier" (
    "categoryId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CategorySupplier_pkey" PRIMARY KEY ("categoryId","supplierId")
);

-- AddForeignKey
ALTER TABLE "CategorySupplier" ADD CONSTRAINT "CategorySupplier_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategorySupplier" ADD CONSTRAINT "CategorySupplier_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
