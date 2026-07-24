export interface Expense {
  id: string;
  date: Date;
  amount: number;
  vendor?: string | null;
  category_id?: number | null;
  note?: string | null;
}

export interface CreateExpenseRequest {
  date?: string;
  amount: number;
  vendor: string;
  category_id: number;
  note?: string | null;
}
