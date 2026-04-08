import { Body, Controller, Get, Path, Post, Put, Delete, Route, SuccessResponse, Response, Query, Request } from 'tsoa'
import { Expense, CreateExpenseRequest } from '../models/Expense.js'
import { prisma } from '../db.js'
import { getAuth } from '@clerk/express'
import { Request as ExpressRequest } from 'express'

const expenses = new Map<string, Expense>()

interface IExpenseFilter {
    sortBy: string,
    sortDirection: 'asc' | 'desc',
    categoryId?: number,
    dateRange?: {
        from: string,
        to: string
    }
}

@Route('api/expenses')
export class ExpensesController extends Controller {
    @Get()
    @Response(401, 'Unauthorized')
    public async getExpenses(
        @Request() request: ExpressRequest,
        @Query() sortBy?: string,
        @Query() sortDirection?: 'asc' | 'desc',
        @Query() size?: number,
        @Query() categoryId?: number,
        @Query() vendor?: string,
        @Query() from?: string,
        @Query() to?: string,
    ): Promise<Expense[]> {
        const user = getAuth(request);

        if (!user || !user.userId) {
            this.setStatus(401);
            throw new Error('Unauthorized');
        }

        const dbExpenses = await prisma.expense.findMany({
            orderBy: sortBy ? { [sortBy]: sortDirection || 'asc' } : undefined,
            where: {
                userId: user.userId,
                category_id: categoryId,
                vendor: vendor ? { contains: vendor, mode: 'insensitive' } : undefined,
                date: from && to ? { gte: from, lte: to } : undefined,
            },
            take: size,
        });
        return dbExpenses;
    }

    @Get('{id}')
    @Response<{}>(404, 'Not Found')
    public async getExpense(@Path() id: string): Promise<Expense> {
        const expense = expenses.get(id)
        if (!expense) {
            this.setStatus(404)
            throw new Error('Expense not found')
        }
        return expense
    }

    @SuccessResponse('201', 'Created')
    @Post()
    @Response<{}>(400, 'Bad request')
    public async createExpense(@Body() requestBody: CreateExpenseRequest): Promise<Expense> {
        const id = crypto.randomUUID()
        const expense: Expense = {
            id,
            vendor: requestBody.vendor,
            amount: requestBody.amount,
            date: requestBody.date || new Date().toISOString(),
            category_id: requestBody.category_id,
        }
        expenses.set(id, expense)
        this.setStatus(201)
        return expense
    }

    @Put('{id}')
    @Response<{}>(404, 'Not Found')
    public async updateExpense(@Path() id: string, @Body() requestBody: CreateExpenseRequest): Promise<Expense> {
        const existing = expenses.get(id)
        if (!existing) {
            this.setStatus(404)
            throw new Error('Expense not found')
        }
        const updated: Expense = {
            id,
            vendor: requestBody.vendor ?? existing.vendor,
            amount: requestBody.amount ?? existing.amount,
            date: requestBody.date ?? existing.date,
            category_id: requestBody.category_id ?? existing.category_id,
        }
        expenses.set(id, updated)
        return updated
    }

    @Delete('{id}')
    @Response<{}>(404, 'Not Found')
    public async deleteExpense(@Path() id: string): Promise<void> {
        const deleted = expenses.delete(id)
        if (!deleted) {
            this.setStatus(404)
            throw new Error('Expense not found')
        }
        this.setStatus(204)
    }
}
