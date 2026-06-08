import 'dotenv/config';
import request from 'supertest';
import type { Express } from 'express';
import type { PrismaClient } from '@prisma/client';

type AuthSession = {
  email: string;
  password: string;
  token: string;
};

const runSmoke = process.env.RUN_SMOKE_TESTS === 'true';
const describeSmoke = runSmoke ? describe : describe.skip;
let app: Express;
let prisma: PrismaClient;
let prismaConnected = false;

const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = 'SmokePass123!';
const buyerEmail = `smoke-buyer-${unique}@mollmart.test`;
const sellerEmail = `smoke-seller-${unique}@mollmart.test`;
const categorySlug = `smoke-category-${unique}`;

function assertSafeSmokeDatabase(): void {
  const databaseUrl = process.env.DATABASE_URL ?? '';
  if (!/localhost|127\.0\.0\.1/.test(databaseUrl)) {
    throw new Error('Smoke tests must run against a local database. Set DATABASE_URL to localhost before running.');
  }
}

async function cleanupSmokeData(): Promise<void> {
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [buyerEmail, sellerEmail]
      }
    }
  });

  await prisma.category.deleteMany({
    where: {
      slug: categorySlug
    }
  });
}

async function createCategory(): Promise<string> {
  const category = await prisma.category.upsert({
    where: { slug: categorySlug },
    update: { isActive: true },
    create: {
      name: `Smoke Category ${unique}`,
      slug: categorySlug,
      isActive: true
    }
  });

  return category.id;
}

async function signupAndLogin(role: 'buyer' | 'seller', email: string): Promise<AuthSession> {
  const signupRes = await request(app)
    .post('/api/v1/auth/signup')
    .send({
      username: `Smoke ${role}`,
      email,
      password,
      role
    });

  expect([200, 201]).toContain(signupRes.status);
  expect(signupRes.body).toMatchObject({ requiresEmailVerification: true });
  expect(typeof signupRes.body.verificationToken).toBe('string');

  const verifyRes = await request(app)
    .post(`/api/v1/verify-email/${encodeURIComponent(signupRes.body.verificationToken as string)}`);

  expect(verifyRes.status).toBe(200);

  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });

  expect(loginRes.status).toBe(200);
  expect(typeof loginRes.body.accessToken).toBe('string');

  return {
    email,
    password,
    token: loginRes.body.accessToken as string
  };
}

describeSmoke('backend smoke flow', () => {
  let buyer: AuthSession;
  let seller: AuthSession;
  let categoryId: string;
  let requestId: string;
  let offerId: string;

  beforeAll(async () => {
    assertSafeSmokeDatabase();
    app = require('../app').default as Express;
    prisma = require('../config/prisma').default as PrismaClient;
    await prisma.$connect();
    prismaConnected = true;
    await cleanupSmokeData();
    categoryId = await createCategory();
  });

  afterAll(async () => {
    if (prisma) {
      if (prismaConnected) {
        await cleanupSmokeData();
      }
      await prisma.$disconnect();
    }
  });

  it('serves the health endpoint', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('signs up and logs in buyer and seller users', async () => {
    buyer = await signupAndLogin('buyer', buyerEmail);
    seller = await signupAndLogin('seller', sellerEmail);
  });

  it('lists catalog categories', async () => {
    const res = await request(app).get('/api/v1/catalog/categories');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((category: { id?: string }) => category.id === categoryId)).toBe(true);
  });

  it('creates and publishes a buyer request', async () => {
    const createRes = await request(app)
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${buyer.token}`)
      .send({
        title: 'Smoke test laptop request',
        description: 'A smoke test buyer request with enough useful details.',
        categoryId,
        quantity: 2,
        budgetMin: 100,
        budgetMax: 300,
        currency: 'USD',
        location: 'Test City',
        isNegotiable: true
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.status).toBe('draft');
    requestId = createRes.body.id as string;

    const publishRes = await request(app)
      .post(`/api/v1/requests/${requestId}/publish`)
      .set('Authorization', `Bearer ${buyer.token}`);

    expect(publishRes.status).toBe(200);
    expect(publishRes.body.status).toBe('published');
  });

  it('creates a seller offer for the request', async () => {
    const res = await request(app)
      .post('/api/v1/offers')
      .set('Authorization', `Bearer ${seller.token}`)
      .send({
        requestId,
        price: 125,
        currency: 'USD',
        message: 'Smoke seller can provide this item in good condition.',
        deliveryDays: 5
      });

    expect(res.status).toBe(201);
    expect(res.body.requestId).toBe(requestId);
    expect(res.body.status).toBe('submitted');
    offerId = res.body.id as string;
  });

  it('accepts the offer and opens a buyer-seller conversation', async () => {
    const acceptRes = await request(app)
      .post(`/api/v1/offers/${offerId}/accept`)
      .set('Authorization', `Bearer ${buyer.token}`);

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.status).toBe('accepted');

    const conversationsRes = await request(app)
      .get('/api/v1/conversations')
      .set('Authorization', `Bearer ${buyer.token}`);

    expect(conversationsRes.status).toBe(200);
    expect(Array.isArray(conversationsRes.body.items)).toBe(true);
    expect(
      conversationsRes.body.items.some(
        (conversation: { requestId?: string; offerId?: string }) =>
          conversation.requestId === requestId && conversation.offerId === offerId
      )
    ).toBe(true);
  });
});
