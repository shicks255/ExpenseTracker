-- CreateTable
CREATE TABLE "Expense" (
    "id" UUID NOT NULL,
    "date" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "vendor" TEXT NOT NULL,
    "category_id" INTEGER NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);
