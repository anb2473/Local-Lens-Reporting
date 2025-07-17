/*
  Warnings:

  - You are about to drop the column `attachedFiles` on the `News` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Region` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "News" DROP COLUMN "attachedFiles";

-- CreateIndex
CREATE UNIQUE INDEX "Region_name_key" ON "Region"("name");
