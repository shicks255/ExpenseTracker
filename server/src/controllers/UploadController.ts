import { Body, Controller, Post, Request, Response, Route, UploadedFile } from 'tsoa';
import { prisma } from '../db.js';
import { getAuth } from '@clerk/express';
import { Request as ExpressRequest } from 'express';
import fs from 'node:fs/promises';
import path from 'path';
import { PDFParse } from 'pdf-parse';
import { upload } from '../index.js';

interface UploadResults {
  items: UploadExpenseItem[];
}

interface UploadExpenseItem {
  date: string;
  amount: number;
  text: string;
  possibleDuplicateString?: string;
}

async function getFileBuffer(file: Express.Multer.File): Promise<Buffer> {
  if (file.buffer) {
    return file.buffer;
  }

  if (file.path) {
    return fs.readFile(file.path);
  }

  throw new Error('Uploaded PDF has no accessible contents');
}

@Route('api/upload')
export class UploadController extends Controller {
  @Post()
  @Response(401, 'Unauthorized')
  public async uploadExpenseStatement(
    @UploadedFile('pdf') expenseUploadFile: Express.Multer.File,
    @Request() request: ExpressRequest,
  ): Promise<UploadResults> {
    const user = getAuth(request);

    if (!user || !user.userId) {
      this.setStatus(401);
      throw new Error('Unauthorized');
    }
    if (!expenseUploadFile) {
      this.setStatus(400);
      throw new Error('No expense PDF was uploaded');
    }
    if (expenseUploadFile.mimetype !== 'application/pdf') {
      this.setStatus(400);
      throw new Error('Only PDF files are allowed');
    }

    const isPdf = expenseUploadFile.originalname.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      this.setStatus(400);
      throw new Error('Only PDF files are allowed');
    }

    this.setStatus(201);

    const pdfBuffer = await getFileBuffer(expenseUploadFile);

    // const file = await fs.readFile(path.join(process.cwd(), 'chase.pdf'));

    const parser = new PDFParse({
      data: pdfBuffer,
    });

    try {
      const result = await parser.getText();
      const fileText = result.text;
      const lines = fileText.split(/\r?\n/).map((line) => line.trim());

      const dueDate = lines.find((line) => {
        return line.match(/(\d{2})\/(\d{2})\/(\d{2})/);
      });
      const year = '20' + dueDate?.match(/(\d{2})\/(\d{2})\/(\d{2})/)?.[3];
      const prevYear = Number(year) - 1;

      const lineItems = lines.filter((line) => {
        return line.match(/^\b(\d{2})\/(\d{2})\b/);
      });

      const items = lineItems.map((item) => {
        const lineDate = item.match(/^\b(\d{2})\/(\d{2})\b/)?.[0];
        const dateString = year + '-' + lineDate?.replace('/', '-');

        const amount = item.match(/(\d[\d,]*\.\d{2})$/);

        if (!lineDate || !amount) {
          return null;
        }

        const dollarAmount = Number(amount[0].replace(/[,.]/g, ''));

        const text = item.replace(lineDate, '').replace(amount[0], '');

        if (!text) {
          return null;
        }

        return {
          date: dateString,
          amount: dollarAmount,
          text: text.trim(),
        };
      });

      const expenses = items
        .filter((item) => !!item)
        .sort((a, b) => {
          return a.date > b.date ? 1 : -1;
        });

      const months = [
        ...new Set(
          expenses.map((e) => {
            return e.date.split('-')[1];
          }),
        ),
      ];

      const prevYearMonths: string[] = [];
      months.forEach((v, i) => {
        if (i == 0) {
          return;
        }

        const prev = Number(v) - 1;
        if (prev != Number(months[i - 1])) {
          prevYearMonths.push(v);
        }
      });

      const fixedExpenses = expenses
        .map((expense) => {
          const month = expense.date.split('-')[1];
          if (prevYearMonths.includes(month)) {
            const tokens = expense.date.split('-');
            return {
              ...expense,
              date: prevYear + '-' + tokens[1] + '-' + tokens[2],
            };
          } else {
            return expense;
          }
        })
        .sort((a, b) => {
          return a.date > b.date ? 1 : -1;
        });

      const finalExpenses = fixedExpenses.map(async (expense) => {
        const similar = await prisma.expense.findMany({
          where: {
            userId: user.userId,
            date: new Date(expense.date),
            amount: expense.amount,
          },
        });

        return {
          ...expense,
          possibleDuplicateString: similar ? JSON.stringify(similar) : '',
        };
      });

      const i = await Promise.all(finalExpenses);

      return {
        items: i,
      };
    } finally {
      await parser.destroy();
    }
  }
}
