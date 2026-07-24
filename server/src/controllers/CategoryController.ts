import {
  Body,
  Controller,
  Get,
  Path,
  Put,
  Delete,
  Route,
  SuccessResponse,
  Response,
  Query,
  Request,
  Post,
} from 'tsoa';
import { Category, CreateCategoryInput } from '../models/Category.js';
import { prisma } from '../db.js';
import { getAuth } from '@clerk/express';
import { UserCategory } from '../generated/prisma/client.js';

@Route('api/categories')
export class CategoryController extends Controller {
  @Post('/{category}')
  @Response(401, 'Unauthorized')
  public async postCategory(
    @Request() request: any,
    @Path() category: string,
  ): Promise<UserCategory> {
    const user = getAuth(request);
    console.log(user);

    if (!user || !user.userId) {
      this.setStatus(401);
      throw new Error('Unauthorized');
    }

    const existing = await prisma.userCategory.findFirst({
      where: {
        userId: user.userId,
      },
      orderBy: {
        id: 'desc',
      },
    });

    const latest = existing?.id;
    console.log(existing);

    const result = await prisma.userCategory.create({
      data: {
        id: (latest ?? 0) + 1,
        name: category,
        userId: user.userId,
        notes: '',
      },
    });

    return result;
  }

  @Get()
  @Response(401, 'Unauthorized')
  public async getCategories(@Request() request: any): Promise<Category[]> {
    const user = getAuth(request);
    console.log(user);

    if (!user || !user.userId) {
      this.setStatus(401);
      throw new Error('Unauthorized');
    }

    const dbCategories = await prisma.userCategory.findMany({
      where: {
        userId: user.userId,
      },
    });
    return dbCategories;
  }
}
