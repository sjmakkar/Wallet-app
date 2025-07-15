/*
  Warnings:

  - You are about to drop the column `ampount` on the `onRampTransaction` table. All the data in the column will be lost.
  - Added the required column `amount` to the `onRampTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "onRampTransaction" DROP COLUMN "ampount",
ADD COLUMN     "amount" INTEGER NOT NULL;
