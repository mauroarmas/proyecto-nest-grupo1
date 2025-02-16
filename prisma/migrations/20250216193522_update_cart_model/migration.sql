-- DropIndex
DROP INDEX "Cart_userId_key";

-- AlterTable
ALTER TABLE "Cart" ALTER COLUMN "status" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Cart_userId_isDeleted_status_idx" ON "Cart"("userId", "isDeleted", "status");
