import { Body, Controller, Post, Request, Response, Route } from 'tsoa';
import { prisma } from '../db.js';
import { getAuth } from '@clerk/express';
import { Request as ExpressRequest } from 'express';

interface RequestInput {
  aggregation: 'daily' | 'weekly' | 'monthly' | 'yearly';
  groupBy: 'category' | 'vendor';
  filterBy?: {
    categoryIds?: number[];
  };
  from: string;
  to: string;
}

interface ReportRow {
  periodStart: string;
  groupKey: string;
  groupLabel: string;
  totalAmount: number;
  expenseCount: number;
}

interface Report {
  aggregation: RequestInput['aggregation'];
  groupBy: RequestInput['groupBy'];
  from: string;
  to: string;
  rows: ReportRow[];
}

const parseReportDate = (value: string): Date => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid date');
  }

  return parsed;
};

const getBucketStart = (date: Date, aggregation: RequestInput['aggregation']): Date => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  switch (aggregation) {
    case 'daily':
      return new Date(Date.UTC(year, month, day));
    case 'weekly': {
      const dayOfWeek = date.getUTCDay();
      const isoDay = dayOfWeek === 0 ? 7 : dayOfWeek;
      return new Date(Date.UTC(year, month, day - (isoDay - 1)));
    }
    case 'monthly':
      return new Date(Date.UTC(year, month, 1));
    case 'yearly':
      return new Date(Date.UTC(year, 0, 1));
  }
};

@Route('api/reporting')
export class ReportingController extends Controller {
  @Post()
  @Response(401, 'Unauthorized')
  public async getExpensesReport(
    @Body() body: RequestInput,
    @Request() request: ExpressRequest,
  ): Promise<Report> {
    const user = getAuth(request);

    if (!user || !user.userId) {
      this.setStatus(401);
      throw new Error('Unauthorized');
    }

    const from = parseReportDate(body.from);
    const to = parseReportDate(body.to);

    const expenses = await prisma.expense.findMany({
      where: {
        userId: user.userId,
        date: {
          gte: from,
          lte: to,
        },
        category_id: body.filterBy?.categoryIds ? { in: body.filterBy.categoryIds } : undefined,
      },
      orderBy: {
        date: 'asc',
      },
    });

    const categories =
      body.groupBy === 'category'
        ? await prisma.userCategory.findMany({
            where: {
              userId: user.userId,
            },
          })
        : [];

    const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
    const groupedRows = new Map<string, ReportRow>();

    for (const expense of expenses) {
      const bucketStart = getBucketStart(expense.date, body.aggregation).toISOString();
      const groupKey =
        body.groupBy === 'category'
          ? String(expense.category_id ?? 'uncategorized')
          : expense.vendor?.trim() || 'unknown-vendor';
      const groupLabel =
        body.groupBy === 'category'
          ? (categoryNames.get(expense.category_id ?? -1) ?? 'Uncategorized')
          : expense.vendor?.trim() || 'Unknown Vendor';
      const reportKey = `${bucketStart}::${groupKey}`;
      const existing = groupedRows.get(reportKey);

      if (existing) {
        existing.totalAmount += expense.amount;
        existing.expenseCount += 1;
        continue;
      }

      groupedRows.set(reportKey, {
        periodStart: bucketStart,
        groupKey,
        groupLabel,
        totalAmount: expense.amount,
        expenseCount: 1,
      });
    }

    return {
      aggregation: body.aggregation,
      groupBy: body.groupBy,
      from: from.toISOString(),
      to: to.toISOString(),
      rows: Array.from(groupedRows.values()).sort((left, right) => {
        if (left.periodStart !== right.periodStart) {
          return left.periodStart.localeCompare(right.periodStart);
        }

        return left.groupLabel.localeCompare(right.groupLabel);
      }),
    };
  }
}
