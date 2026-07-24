export type Expense = {
  id: string;
  date: string;
  amount: number;
  vendor: string;
  note: string;
  category_id: number;
};

export type ExpensesResult = {
  expenses: Expense[];
  hasMore: boolean;
};

export type UpdateExpense = {
  id?: string;
  date?: string;
  amount?: number;
  vendor?: string;
  note?: string;
  category_id?: number;
};

export type UserCategory = {
  id: number;
  name: string;
  notes: string;
};
