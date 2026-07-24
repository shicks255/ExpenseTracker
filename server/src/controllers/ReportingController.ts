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
  rows: ReportResult[];
}

interface ReportResult {
  bucket: Date;
  values: Record<string, number>;
}

const parseReportDate = (value: string): Date => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid date');
  }

  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
};

interface IFromTo {
  start: Date;
  end: Date;
}

const getDateBuckets = (
  from: Date,
  to: Date,
  aggregation: RequestInput['aggregation'],
): IFromTo[] => {
  const buckets: IFromTo[] = [];
  const current = new Date(from);

  switch (aggregation) {
    case 'daily': {
      current.setUTCHours(0, 0, 0, 0);

      while (current <= to) {
        const end = new Date(current);
        end.setUTCDate(end.getUTCDate() + 1);

        buckets.push({
          start: new Date(current),
          end,
        });

        current.setUTCDate(current.getUTCDate() + 1);
      }

      break;
    }

    case 'weekly': {
      current.setUTCHours(0, 0, 0, 0);

      while (current <= to) {
        const end = new Date(current);
        end.setUTCDate(end.getUTCDate() + 7);

        buckets.push({
          start: new Date(current),
          end,
        });

        current.setUTCDate(current.getUTCDate() + 7);
      }

      break;
    }

    case 'monthly': {
      current.setUTCDate(1);
      current.setUTCHours(0, 0, 0, 0);

      while (current <= to) {
        const end = new Date(current);
        end.setUTCMonth(end.getUTCMonth() + 1);

        buckets.push({
          start: new Date(current),
          end,
        });

        current.setUTCMonth(current.getUTCMonth() + 1);
      }

      break;
    }

    case 'yearly': {
      current.setUTCMonth(0, 1);
      current.setUTCHours(0, 0, 0, 0);

      while (current <= to) {
        const end = new Date(current);
        end.setUTCFullYear(end.getUTCFullYear() + 1);

        buckets.push({
          start: new Date(current),
          end,
        });

        current.setUTCFullYear(current.getUTCFullYear() + 1);
      }

      break;
    }
  }

  return buckets;
};

const getOldest = async () => {
  return prisma.expense.findFirst({});
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

    const from = body.from
      ? parseReportDate(body.from)
      : await prisma.expense
          .findFirst({
            where: {
              userId: user.userId,
            },
            orderBy: {
              date: 'asc',
            },
          })
          .then((e) => e?.date);
    const to = body.to ? parseReportDate(body.to) : new Date();

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

    const catCounts = categories.reduce<Record<string, number>>((prev, cur) => {
      prev[cur.id] = 0;
      return prev;
    }, {});

    // @ts-ignore
    const dateBuckets = getDateBuckets(from, to, body.aggregation);
    const results = dateBuckets.map((bucket) => {
      return {
        bucket: bucket.start,
        catCounts: { ...catCounts },
      };
    });

    for (const expense of expenses) {
      const bucket = dateBuckets.find((b) => {
        return (
          b.start.getTime() <= expense.date.getTime() && b.end.getTime() > expense.date.getTime()
        );
      })?.start;

      results.forEach((r) => {
        if (r.bucket == bucket) {
          r.catCounts[expense.category_id!] += expense.amount;
        }
      });
      console.log(results);
    }

    const fixedResults = results.map((e) => {
      return {
        ...e,
        bucket: e.bucket.toISOString().slice(0, 10),
      };
    });

    return {
      aggregation: body.aggregation,
      // @ts-expect-error not needed
      from: from.toLocaleDateString(),
      to: to.toLocaleDateString(),
      rows: results.map((rr) => {
        return {
          bucket: rr.bucket,
          values: rr.catCounts,
        };
      }),
      groupBy: 'category',
    };

    // for (const expense of expenses) {
    //   const bucketStart = getBucketStart(expense.date, body.aggregation).toISOString();
    //   const groupKey =
    //     body.groupBy === 'category'
    //       ? String(expense.category_id ?? 'uncategorized')
    //       : expense.vendor?.trim() || 'unknown-vendor';
    //   const groupLabel =
    //     body.groupBy === 'category'
    //       ? (categoryNames.get(expense.category_id ?? -1) ?? 'Uncategorized')
    //       : expense.vendor?.trim() || 'Unknown Vendor';
    //   const reportKey = `${bucketStart}::${groupKey}`;
    //   const existing = groupedRows.get(reportKey);

    //   groupedRows.set(bucketStart, {
    //     periodStart: bucketStart,
    //     groupKey,
    //     groupLabel,
    //     totalAmount: expense.amount,
    //     expenseCount: 1,
    //   });
    // }

    // return {
    //   aggregation: body.aggregation,
    //   groupBy: body.groupBy,
    //   from: from.toISOString(),
    //   to: to.toISOString(),
    //   rows: Array.from(groupedRows.values()).sort((left, right) => {
    //     if (left.periodStart !== right.periodStart) {
    //       return left.periodStart.localeCompare(right.periodStart);
    //     }

    //     return left.groupLabel.localeCompare(right.groupLabel);
    //   }),
    // };
  }
}
