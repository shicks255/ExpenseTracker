import express from 'express';
import 'dotenv/config';
import cors, { type CorsOptions } from 'cors';
import swaggerUi from 'swagger-ui-express';
import { clerkMiddleware, requireAuth, getAuth } from '@clerk/express';

import { prisma } from './db.js';
import { RegisterRoutes } from './routes.js';
import swaggerDocument from '../swagger.json' with { type: 'json' };

const app = express();

const allowedOrigins = ['http://localhost:5173', 'https://expenses.shicks255.com'];

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Requests from curl, Postman, server-side clients, etc.
    // do not necessarily contain an Origin header.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    console.error(`Blocked CORS origin: ${origin}`);
    callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204,
};

// Must come before Clerk and all routes.
app.use(cors(corsOptions));

app.use(express.json());

app.use(
  clerkMiddleware({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  }),
);

app.get('/api/me', requireAuth(), (req, res) => {
  res.json(getAuth(req));
});

RegisterRoutes(app);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const PORT = Number(process.env.PORT ?? 8181);

async function startServer(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('Connected to database');

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

void startServer();
