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
} from 'tsoa';
import { Category, CreateCategoryInput } from '../models/Category.js';
import { prisma } from '../db.js';
import { getAuth } from '@clerk/express';

@Route('api/categories')
export class CategoryController extends Controller {
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
