import {
  Body,
  Controller,
  Get,
  Path,
  Post,
  Put,
  Delete,
  Route,
  SuccessResponse,
  Response,
  Query,
  Request,
} from 'tsoa';
import { Expense, CreateExpenseRequest } from '../models/Expense.js';
import { prisma } from '../db.js';
import { authenticateRequest, getAuth } from '@clerk/express';
import { debugRequestState } from '@clerk/backend/internal';
import { createClerkClient } from '@clerk/backend';
import { Request as ExpressRequest } from 'express';

const expenses = new Map<string, Expense>();

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
});

const parseExpenseDate = (value: string): Date => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid date');
  }

  return parsed;
};

const decodeJwtPayload = (authorizationHeader?: string) => {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authorizationHeader.slice('Bearer '.length);
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const payload = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return null;
  }
};

interface IExpenseFilter {
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  categoryId?: number;
  dateRange?: {
    from: string;
    to: string;
  };
}

interface ExpenseResult {
  expenses: Expense[];
  hasMore: boolean;
}

interface UpdateVendorBody {
  oldVendor: string;
  newVendor: string;
}

@Route('api/expenses/vendor')
export class ExpenseVendorController extends Controller {
  @Put()
  @Response(401, 'Unauthorized')
  public async updateExpenseVendor(
    @Request() request: ExpressRequest,
    @Body() body: UpdateVendorBody,
  ): Promise<{ message: string }> {
    const requestState = await authenticateRequest({
      clerkClient,
      request,
      options: {
        secretKey: process.env.CLERK_SECRET_KEY,
        publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
        acceptsToken: 'any',
      },
    });
    const user = getAuth(request);

    if (!user || !user.userId) {
      this.setStatus(401);
      throw new Error('Unauthorized');
    }

    const { oldVendor, newVendor } = body;
    await prisma.expense.updateMany({
      where: {
        userId: user.userId,
        vendor: oldVendor,
      },
      data: {
        vendor: newVendor,
      },
    });

    // Here you would implement the logic to update the expense vendor in your database.
    // For demonstration purposes, we'll just return a success message.

    return { message: 'Expense vendor updated successfully' };
  }
}

@Route('api/expenses/vendors')
export class ExpenseVendorsController extends Controller {
  @Get()
  @Response(401, 'Unauthorized')
  public async getExpenseVendors(@Request() request: ExpressRequest): Promise<string[]> {
    const requestState = await authenticateRequest({
      clerkClient,
      request,
      options: {
        secretKey: process.env.CLERK_SECRET_KEY,
        publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
        acceptsToken: 'any',
      },
    });
    const user = getAuth(request);

    if (!user || !user.userId) {
      this.setStatus(401);
      throw new Error('Unauthorized');
    }

    console.log('GET /api/expenses/vendors auth debug');
    const dbVendors = await prisma.expense.findMany({
      where: {
        userId: user.userId,
      },
      distinct: ['vendor'],
      select: {
        vendor: true,
      },
      orderBy: {
        vendor: 'asc',
      },
    });

    return dbVendors
      .map((expense) => expense.vendor)
      .filter((vendor): vendor is string => vendor !== null);
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
    @Query() pageSize?: number,
    @Query() pageNumber?: number,
    @Query() categoryIds?: number[],
    @Query() vendor?: string,
    @Query() from?: string,
    @Query() to?: string,
  ): Promise<ExpenseResult> {
    const requestState = await authenticateRequest({
      clerkClient,
      request,
      options: {
        secretKey: process.env.CLERK_SECRET_KEY,
        publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
        acceptsToken: 'any',
      },
    });
    const user = getAuth(request);

    if (!user || !user.userId) {
      this.setStatus(401);
      throw new Error('Unauthorized');
    }

    const dbExpenses = await prisma.expense.findMany({
      orderBy: sortBy ? { [sortBy]: sortDirection || 'asc' } : undefined,
      where: {
        userId: user.userId,
        category_id: { in: categoryIds },
        vendor: vendor ? { contains: vendor, mode: 'insensitive' } : undefined,
        date:
          from && to
            ? {
                gte: parseExpenseDate(from),
                lte: parseExpenseDate(to),
              }
            : undefined,
      },
      take: pageSize ? pageSize + 1 : undefined,
      skip: pageNumber ? (pageNumber - 1) * pageSize! : 0,
    });

    return {
      expenses: dbExpenses,
      hasMore: (pageSize && dbExpenses.length > pageSize) || false,
    };
  }

  @Get('{id}')
  @Response<{}>(404, 'Not Found')
  public async getExpense(@Path() id: string): Promise<Expense> {
    const expense = expenses.get(id);
    if (!expense) {
      this.setStatus(404);
      throw new Error('Expense not found');
    }
    return expense;
  }

  @SuccessResponse('201', 'Created')
  @Post()
  @Response<{}>(400, 'Bad request')
  public async createExpense(@Body() requestBody: CreateExpenseRequest): Promise<Expense> {
    const id = crypto.randomUUID();
    const expense: Expense = {
      id,
      vendor: requestBody.vendor,
      amount: requestBody.amount,
      date: requestBody.date ? parseExpenseDate(requestBody.date) : new Date(),
      category_id: requestBody.category_id,
    };
    expenses.set(id, expense);
    this.setStatus(201);
    return expense;
  }

  @Put('{id}')
  @Response<{}>(404, 'Not Found')
  public async updateExpense(
    @Path() id: string,
    @Body() requestBody: CreateExpenseRequest,
  ): Promise<Expense> {
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) {
      this.setStatus(404);
      throw new Error('Expense not found');
    }
    const updated: Expense = {
      id,
      vendor: requestBody.vendor ?? existing.vendor,
      amount: requestBody.amount ?? existing.amount,
      date: requestBody.date ? parseExpenseDate(requestBody.date) : existing.date,
      category_id: requestBody.category_id ?? existing.category_id,
      note: requestBody.note ?? existing.note,
    };

    const result = await prisma.expense.update({
      where: { id },
      data: {
        vendor: updated.vendor,
        amount: updated.amount,
        date: updated.date,
        category_id: updated.category_id,
        note: updated.note,
      },
    });
    return result;
  }

  @Delete('{id}')
  @Response<{}>(404, 'Not Found')
  public async deleteExpense(@Path() id: string): Promise<void> {
    const deleted = expenses.delete(id);
    if (!deleted) {
      this.setStatus(404);
      throw new Error('Expense not found');
    }
    this.setStatus(204);
  }
}
