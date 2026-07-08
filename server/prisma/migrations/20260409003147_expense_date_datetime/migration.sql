-- AlterTable
ALTER TABLE "Expense"
ALTER COLUMN "date" TYPE TIMESTAMP(3)
USING "date"::timestamp(3);
