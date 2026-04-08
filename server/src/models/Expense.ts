export interface Expense {
    id: string
    date: string
    amount: number
    vendor: string
    category_id: number
}

export interface CreateExpenseRequest {
    date?: string
    amount: number
    vendor: string
    category_id: number
}
