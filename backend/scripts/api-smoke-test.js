const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const base = process.env.API_BASE_URL || 'http://localhost:4040';
const runId = `${Date.now()}`;
const password = 'SmokePass123!';
const changedPassword = 'SmokePass456!';
const results = [];
const state = {};

const email = (role) => `api-smoke-${role}-${runId}@example.com`;
const auth = (token) => ({ Authorization: `Bearer ${token}` });
const cookieHeader = (cookie) => (cookie ? { Cookie: cookie } : {});
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function record(ok, name, status, detail = '') {
  results.push({ ok, name, status, detail });
}

async function req(name, method, path, { token, cookie, body, expect = [200], headers = {} } = {}) {
  const requestHeaders = { ...headers, ...cookieHeader(cookie) };
  if (token) Object.assign(requestHeaders, auth(token));
  if (body !== undefined) requestHeaders['Content-Type'] = 'application/json';

  try {
    const res = await fetch(base + path, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    const expected = Array.isArray(expect) ? expect : [expect];
    const ok = expected.includes(res.status);
    record(ok, name, res.status, ok ? '' : `expected ${expected.join('/')} body=${String(text).slice(0, 240)}`);
    return { ok, res, data, text, cookie: res.headers.get('set-cookie') };
  } catch (error) {
    record(false, name, 'ERR', error.message);
    return { ok: false, res: { status: 0 }, data: null, text: '' };
  }
}

async function verifyUserByEmail(mail) {
  const token = await prisma.emailVerificationToken.findFirst({
    where: { user: { email: mail } }
  });
  if (!token) {
    record(false, `verify token exists ${mail}`, 'EMPTY');
    return;
  }
  record(true, `verify token exists ${mail}`, 'OK');
  await req(`verify email ${mail}`, 'GET', `/api/v1/verify-email/${token.token}`, { expect: [200] });
}

async function login(label, mail, pass) {
  const response = await req(`auth login ${label}`, 'POST', '/api/v1/auth/login', {
    body: { email: mail, password: pass },
    expect: [200]
  });
  return {
    token: response.data?.accessToken,
    cookie: response.cookie,
    user: response.data?.user
  };
}

async function main() {
  await prisma.emailVerificationToken.deleteMany({
    where: { user: { email: { contains: 'api-smoke-' } } }
  });
  await prisma.resetToken.deleteMany({
    where: { user: { email: { contains: 'api-smoke-' } } }
  });
  await prisma.refreshToken.deleteMany({
    where: { user: { email: { contains: 'api-smoke-' } } }
  });
  await prisma.user.deleteMany({ where: { email: { contains: 'api-smoke-' } } });
  await prisma.category.deleteMany({ where: { slug: { startsWith: 'api-smoke-' } } }).catch(() => {});

  await req('health', 'GET', '/health', { expect: [200] });
  await req('auth signup invalid body', 'POST', '/api/v1/auth/signup', {
    body: { email: 'bad' },
    expect: [400]
  });

  for (const role of ['buyer', 'seller', 'admin', 'outsider', 'block-target', 'unverified']) {
    const signupResponse = await req(`auth signup ${role}`, 'POST', '/api/v1/auth/signup', {
      body: {
        username: `Smoke ${role}`,
        email: email(role),
        password,
        role: role === 'seller' ? 'seller' : 'buyer'
      },
      expect: [201]
    });
    state.requiresEmailVerification =
      state.requiresEmailVerification ||
      Boolean(signupResponse.data?.requiresEmailVerification || signupResponse.data?.verificationToken);
  }

  if (state.requiresEmailVerification) {
    await req('auth login unverified denied', 'POST', '/api/v1/auth/login', {
      body: { email: email('unverified'), password },
      expect: [401]
    });

    for (const role of ['buyer', 'seller', 'admin', 'outsider', 'block-target']) {
      await verifyUserByEmail(email(role));
    }
  }

  const adminUser = await prisma.user.update({
    where: { email: email('admin') },
    data: { role: 'admin' }
  });
  const buyerUser = await prisma.user.findUnique({ where: { email: email('buyer') } });
  const sellerUser = await prisma.user.findUnique({ where: { email: email('seller') } });
  const blockTarget = await prisma.user.findUnique({ where: { email: email('block-target') } });

  const buyer = await login('buyer', email('buyer'), password);
  const seller = await login('seller', email('seller'), password);
  const admin = await login('admin', email('admin'), password);
  const outsider = await login('outsider', email('outsider'), password);
  record(Boolean(buyer.token && seller.token && admin.token && outsider.token), 'required login tokens', 'OK');

  await req('auth login bad password', 'POST', '/api/v1/auth/login', {
    body: { email: email('buyer'), password: 'wrongpass' },
    expect: [401]
  });
  await req('auth me buyer', 'GET', '/api/v1/auth/me', { token: buyer.token });
  await req('auth refresh buyer cookie', 'POST', '/api/v1/auth/refresh', { cookie: buyer.cookie });
  await req('auth introspect admin', 'POST', '/api/v1/auth/introspect', {
    token: admin.token,
    body: { token: buyer.token }
  });
  await req('auth admin list users', 'GET', '/api/v1/auth/admin/users?search=api-smoke&role=buyer', {
    token: admin.token
  });
  await req('auth admin get user', 'GET', `/api/v1/auth/admin/users/${blockTarget.id}`, { token: admin.token });
  await req('auth internal/admin get user', 'GET', `/api/v1/auth/users/${blockTarget.id}`, { token: admin.token });
  await req('auth admin patch user', 'PATCH', `/api/v1/auth/admin/users/${blockTarget.id}`, {
    token: admin.token,
    body: { name: 'Smoke Block Target Renamed' }
  });
  await req('auth admin block user', 'POST', `/api/v1/auth/admin/users/${blockTarget.id}/block`, {
    token: admin.token
  });
  await req('auth blocked user login denied', 'POST', '/api/v1/auth/login', {
    body: { email: email('block-target'), password },
    expect: [403]
  });
  await req('auth admin unblock user', 'POST', `/api/v1/auth/admin/users/${blockTarget.id}/unblock`, {
    token: admin.token
  });
  await req('auth admin revoke sessions', 'POST', `/api/v1/auth/admin/users/${blockTarget.id}/revoke-sessions`, {
    token: admin.token
  });
  await req('auth logout buyer', 'POST', '/api/v1/auth/logout', {
    token: buyer.token,
    cookie: buyer.cookie,
    expect: [204]
  });

  await req('profile me buyer ensure', 'GET', '/api/v1/profiles/me', { token: buyer.token });
  await req('profile patch buyer base', 'PATCH', '/api/v1/profiles/me', {
    token: buyer.token,
    body: { fullName: 'Smoke Buyer Full', city: 'Almaty', phone: '+77000000000', avatarUrl: '' }
  });
  await req('profile patch buyer details', 'PATCH', '/api/v1/profiles/me/buyer', {
    token: buyer.token,
    body: { displayName: 'Smoke Buyer Display', city: 'Almaty', preferencesJson: { categories: ['electronics'] } }
  });
  await req('profile seller cannot patch buyer details', 'PATCH', '/api/v1/profiles/me/buyer', {
    token: seller.token,
    body: { displayName: 'Bad' },
    expect: [403]
  });
  await req('profile me seller ensure', 'GET', '/api/v1/profiles/me', { token: seller.token });
  await req('profile patch seller details', 'PATCH', '/api/v1/profiles/me/seller', {
    token: seller.token,
    body: {
      displayName: 'Smoke Seller Shop',
      description: 'API smoke seller',
      businessType: 'electronics',
      website: '',
      instagramUrl: ''
    }
  });
  await req('profile list sellers public', 'GET', '/api/v1/profiles/sellers?limit=10');
  await req('profile get seller public', 'GET', `/api/v1/profiles/sellers/${sellerUser.id}`);
  await req('profile get buyer public', 'GET', `/api/v1/profiles/buyers/${buyerUser.id}`);

  await req('request seller cannot create', 'POST', '/api/v1/requests', {
    token: seller.token,
    body: {
      title: 'Bad seller request',
      description: 'Seller should not create request',
      categoryId: 'electronics',
      budgetMax: 100,
      currency: 'USD'
    },
    expect: [403]
  });
  const created = await req('request buyer create', 'POST', '/api/v1/requests', {
    token: buyer.token,
    body: {
      title: 'Smoke laptop request',
      description: 'Need a business laptop for API smoke testing',
      categoryId: 'electronics',
      budgetMin: 500,
      budgetMax: 900,
      currency: 'USD',
      location: 'Almaty',
      isNegotiable: true,
      attachments: [{ fileName: 'ref.txt', fileUrl: 'https://example.com/ref.txt', mimeType: 'text/plain' }]
    },
    expect: [201]
  });
  state.requestId = created.data?.id;
  await req('request get by id draft owner', 'GET', `/api/v1/requests/${state.requestId}`, { token: buyer.token });
  await req('request patch draft', 'PATCH', `/api/v1/requests/${state.requestId}`, {
    token: buyer.token,
    body: { location: 'Astana' }
  });
  await req('request publish', 'POST', `/api/v1/requests/${state.requestId}/publish`, { token: buyer.token });
  await req('request buyer mine', 'GET', '/api/v1/requests/me?limit=10', { token: buyer.token });
  await req('request buyer cannot seller board', 'GET', '/api/v1/requests', {
    token: buyer.token,
    expect: [403]
  });
  await req('request seller board', 'GET', '/api/v1/requests?limit=10&q=laptop', { token: seller.token });
  await req('request seller get published by id', 'GET', `/api/v1/requests/${state.requestId}`, {
    token: seller.token
  });

  await req('offer buyer cannot create', 'POST', '/api/v1/offers', {
    token: buyer.token,
    body: { requestId: state.requestId, price: 800, currency: 'USD', message: 'Buyer cannot offer' },
    expect: [403]
  });
  const offer = await req('offer seller create', 'POST', '/api/v1/offers', {
    token: seller.token,
    body: {
      requestId: state.requestId,
      price: 820,
      currency: 'USD',
      message: 'I can supply this laptop',
      deliveryDays: 3,
      warrantyInfo: 'One year'
    },
    expect: [201]
  });
  state.offerId = offer.data?.id;
  await req('offer seller duplicate denied', 'POST', '/api/v1/offers', {
    token: seller.token,
    body: { requestId: state.requestId, price: 810, currency: 'USD', message: 'Second active offer' },
    expect: [409]
  });
  await req('offer seller update', 'PATCH', `/api/v1/offers/${state.offerId}`, {
    token: seller.token,
    body: { price: 790, message: 'Updated offer price' }
  });
  await req('offer seller mine', 'GET', '/api/v1/offers/me?limit=10', { token: seller.token });
  await req('offer buyer list for request', 'GET', `/api/v1/offers/request/${state.requestId}`, {
    token: buyer.token
  });
  await req('offer seller cannot accept', 'POST', `/api/v1/offers/${state.offerId}/accept`, {
    token: seller.token,
    expect: [403]
  });
  await req('offer buyer accept', 'POST', `/api/v1/offers/${state.offerId}/accept`, { token: buyer.token });
  await req('offer accept idempotent', 'POST', `/api/v1/offers/${state.offerId}/accept`, { token: buyer.token });

  const req2 = await req('request buyer create for withdraw', 'POST', '/api/v1/requests', {
    token: buyer.token,
    body: {
      title: 'Smoke phone request',
      description: 'Need a phone for withdraw test',
      categoryId: 'electronics',
      budgetMax: 500,
      currency: 'USD'
    },
    expect: [201]
  });
  await req('request publish for withdraw', 'POST', `/api/v1/requests/${req2.data?.id}/publish`, {
    token: buyer.token
  });
  const offer2 = await req('offer create for withdraw', 'POST', '/api/v1/offers', {
    token: seller.token,
    body: { requestId: req2.data?.id, price: 420, currency: 'USD', message: 'Withdrawable offer' },
    expect: [201]
  });
  await req('offer withdraw', 'POST', `/api/v1/offers/${offer2.data?.id}/withdraw`, { token: seller.token });

  const req3 = await req('request buyer create for close', 'POST', '/api/v1/requests', {
    token: buyer.token,
    body: {
      title: 'Smoke close request',
      description: 'Request to close in smoke test',
      categoryId: 'services',
      budgetMax: 100,
      currency: 'USD'
    },
    expect: [201]
  });
  await req('request publish for close', 'POST', `/api/v1/requests/${req3.data?.id}/publish`, {
    token: buyer.token
  });
  await req('request close', 'POST', `/api/v1/requests/${req3.data?.id}/close`, { token: buyer.token });
  const req4 = await req('request buyer create for cancel', 'POST', '/api/v1/requests', {
    token: buyer.token,
    body: {
      title: 'Smoke cancel request',
      description: 'Request to cancel in smoke test',
      categoryId: 'services',
      budgetMax: 100,
      currency: 'USD'
    },
    expect: [201]
  });
  await req('request cancel draft', 'POST', `/api/v1/requests/${req4.data?.id}/cancel`, { token: buyer.token });

  await sleep(500);
  const convs = await req('chat list buyer conversations', 'GET', '/api/v1/conversations?limit=10', {
    token: buyer.token
  });
  state.conversationId = convs.data?.items?.[0]?.id;
  record(Boolean(state.conversationId), 'chat conversation auto-created after accept', state.conversationId ? 'OK' : 'EMPTY');
  await req('chat open existing conversation', 'POST', '/api/v1/conversations', {
    token: buyer.token,
    body: { requestId: state.requestId, offerId: state.offerId },
    expect: [200, 201]
  });
  await req('chat get conversation buyer', 'GET', `/api/v1/conversations/${state.conversationId}`, {
    token: buyer.token
  });
  await req('chat outsider forbidden get', 'GET', `/api/v1/conversations/${state.conversationId}`, {
    token: outsider.token,
    expect: [403]
  });
  await req('chat list messages empty', 'GET', `/api/v1/conversations/${state.conversationId}/messages`, {
    token: buyer.token
  });
  await req('chat seller send message', 'POST', `/api/v1/conversations/${state.conversationId}/messages`, {
    token: seller.token,
    body: { body: 'Hello buyer, this is an API smoke message.' },
    expect: [201]
  });
  await req('chat buyer list messages', 'GET', `/api/v1/conversations/${state.conversationId}/messages?limit=10`, {
    token: buyer.token
  });
  await req('chat buyer mark read', 'POST', `/api/v1/conversations/${state.conversationId}/read`, {
    token: buyer.token
  });
  await req('chat invalid empty message', 'POST', `/api/v1/conversations/${state.conversationId}/messages`, {
    token: buyer.token,
    body: { body: '' },
    expect: [400]
  });

  await sleep(1000);
  const buyerNotes = await req('notification buyer list', 'GET', '/api/v1/notifications', { token: buyer.token });
  const sellerNotes = await req('notification seller unread list', 'GET', '/api/v1/notifications?isRead=false', {
    token: seller.token
  });
  const noteId = (buyerNotes.data || [])[0]?.id || (sellerNotes.data || [])[0]?.id;
  if (noteId) {
    await req('notification mark one read', 'POST', `/api/v1/notifications/${noteId}/read`, {
      token: buyer.token,
      expect: [200, 404]
    });
  } else {
    record(false, 'notification mark one read', 'SKIP', 'no notifications created');
  }
  await req('notification mark all read', 'POST', '/api/v1/notifications/read-all', { token: buyer.token });

  const category = await req('admin create category', 'POST', '/api/v1/admin/categories', {
    token: admin.token,
    body: { name: 'API Smoke Category', slug: `api-smoke-${runId}`, isActive: true },
    expect: [201]
  });
  await req('admin list categories', 'GET', '/api/v1/admin/categories', { token: admin.token });
  await req('admin update category', 'PATCH', `/api/v1/admin/categories/${category.data?.id}`, {
    token: admin.token,
    body: { name: 'API Smoke Category Updated', isActive: false }
  });
  const modCase = await req('admin create moderation case', 'POST', '/api/v1/admin/moderation/cases', {
    token: admin.token,
    body: {
      targetType: 'request',
      targetId: state.requestId,
      reason: 'Smoke moderation case',
      assignedTo: adminUser.id
    },
    expect: [201]
  });
  await req('admin list moderation cases', 'GET', '/api/v1/admin/moderation/cases?status=open', {
    token: admin.token
  });
  await req('admin update moderation case hide', 'PATCH', `/api/v1/admin/moderation/cases/${modCase.data?.id}`, {
    token: admin.token,
    body: { actionType: 'hide_content', resolutionNote: 'Hide during smoke test' }
  });
  await req('admin resolve moderation case', 'PATCH', `/api/v1/admin/moderation/cases/${modCase.data?.id}`, {
    token: admin.token,
    body: { status: 'resolved', resolutionNote: 'Resolved by smoke test' }
  });
  await req('admin dashboard summary', 'GET', '/api/v1/admin/dashboard/summary', { token: admin.token });
  await req('admin module block user', 'POST', `/api/v1/admin/users/${blockTarget.id}/block`, {
    token: admin.token,
    body: { reason: 'Smoke block from admin module' }
  });
  await req('admin module unblock user', 'POST', `/api/v1/admin/users/${blockTarget.id}/unblock`, {
    token: admin.token
  });
  await req('admin buyer forbidden categories', 'GET', '/api/v1/admin/categories', {
    token: buyer.token,
    expect: [403]
  });

  const forgot = await req('password forgot buyer', 'POST', '/api/v1/forgot-password', {
    body: { email: email('buyer') }
  });
  const resetRecord = await prisma.resetToken.findFirst({ where: { user: { email: email('buyer') } } });
  const resetToken = forgot.data?.resetToken || resetRecord?.token;
  if (resetToken) {
    await req('password reset page', 'GET', `/api/v1/reset-password/${resetToken}`);
    await req('password reset submit', 'POST', `/api/v1/reset-password/${resetToken}`, {
      body: { newPassword: changedPassword }
    });
    await login('buyer after reset', email('buyer'), changedPassword);
  } else {
    record(false, 'password reset token available', 'EMPTY', 'no reset token');
  }
  const buyer2 = await login('buyer for change-password', email('buyer'), changedPassword);
  await req('auth change password', 'PATCH', '/api/v1/auth/me/password', {
    token: buyer2.token,
    body: { currentPassword: changedPassword, newPassword: password }
  });
  const buyer3 = await login('buyer after change-password', email('buyer'), password);
  await req('auth logout all buyer', 'POST', '/api/v1/auth/logout-all', {
    token: buyer3.token,
    expect: [204]
  });
}

main()
  .catch((error) => {
    record(false, 'scenario uncaught error', 'ERR', error.stack || error.message);
  })
  .finally(async () => {
    const failed = results.filter((result) => !result.ok);
    console.log(JSON.stringify({
      runId,
      total: results.length,
      passed: results.length - failed.length,
      failed: failed.length,
      failures: failed,
      state
    }, null, 2));
    await prisma.$disconnect();
    if (failed.length > 0) process.exitCode = 1;
  });
