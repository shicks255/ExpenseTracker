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
    const anyTokenAuth = getAuth(request, { acceptsToken: 'any' });
    const decodedPayload = decodeJwtPayload(request.headers.authorization);

    console.log('GET /api/expenses auth debug', {
      hasAuthorizationHeader: Boolean(request.headers.authorization),
      authorizationPrefix: request.headers.authorization?.slice(0, 20) ?? null,
      userId: user?.userId ?? null,
      sessionId: user?.sessionId ?? null,
      anyTokenType: anyTokenAuth?.tokenType ?? null,
      anyTokenSubject: 'subject' in anyTokenAuth ? anyTokenAuth.subject : null,
      requestState: debugRequestState(requestState),
      decodedClaims: decodedPayload
        ? {
            iss: decodedPayload.iss ?? null,
            azp: decodedPayload.azp ?? null,
            sub: decodedPayload.sub ?? null,
            sid: decodedPayload.sid ?? null,
            v: decodedPayload.v ?? null,
          }
        : null,
    });

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
        date:
          from && to
            ? {
                gte: parseExpenseDate(from),
                lte: parseExpenseDate(to),
              }
            : undefined,
      },
      take: size,
    });
    return dbExpenses;
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
    const existing = expenses.get(id);
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
    };
    expenses.set(id, updated);
    return updated;
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
