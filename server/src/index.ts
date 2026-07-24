import express from 'express';
import { prisma } from './db.js';
import 'dotenv/config';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { RegisterRoutes } from './routes.js';
import swaggerDocument from '../swagger.json' with { type: 'json' };
import { Prisma } from './generated/prisma/browser.js';
import { clerkMiddleware, requireAuth, getAuth } from '@clerk/express';

const app = express();

app.use(
  clerkMiddleware({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  }),
);
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json());

RegisterRoutes(app);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const PORT = process.env.PORT || 8181;
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

app.get('/api/me', requireAuth(), async (req, res) => {
  const u = getAuth(req);

  res.json(u);
});

console.log('Database connected');
prisma.$connect().then(async () => {
  console.log('Connected to database');

  try {
    console.log('Deleting all categories');
    //   await prisma.userCategory.deleteMany();

    //   const category1 = await prisma.userCategory.create({
    //     data: {
    //       userId: 'user_3C3ErmPiHCVyYTiSKMeN21Ef3b7',
    //       id: 1,
    //       name: 'Food',
    //       notes: 'Expenses for groceries and dining out',
    //     },
    //   });

    //   const category2 = await prisma.userCategory.create({
    //     data: {
    //       userId: 'user_3C3ErmPiHCVyYTiSKMeN21Ef3b7',
    //       id: 2,
    //       name: 'House',
    //       notes: 'Expenses for groceries and dining out',
    //     },
    //   });

    //   const category3 = await prisma.userCategory.create({
    //     data: {
    //       userId: 'user_3C3ErmPiHCVyYTiSKMeN21Ef3b7',
    //       id: 3,
    //       name: 'Other',
    //       notes: 'Expenses for groceries and dining out',
    //     },
    //   });
  } catch (error) {
    console.error('Error creating categories:', error);
  }
  console.log('done database stuff');
});
