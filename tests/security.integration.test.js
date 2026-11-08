const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

describe('Multi-Tenant SaaS Security, RBAC, BOLA & Audit Chain Suite', () => {
  const uniqueSuffix = Date.now();

  let tenantA = {};
  let tenantB = {};
  let customerAId = null;
  let viewerTokenA = null;

  afterAll(async () => {
    
    if (tenantA.id) {
      await db.query('DELETE FROM tenants WHERE id = $1', [tenantA.id]);
    }
    if (tenantB.id) {
      await db.query('DELETE FROM tenants WHERE id = $1', [tenantB.id]);
    }
    await db.pool.end();
  });

  test('1. Health check returns 200 and Helmet strips X-Powered-By header', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  test('2. Registers Tenant A and Tenant B atomically with founding ADMINs', async () => {
    const resA = await request(app)
      .post('/api/v1/auth/register')
      .send({
        tenantName: `BoFA Test ${uniqueSuffix}`,
        email: `admin.a.${uniqueSuffix}@bofa.com`,
        password: 'StrongPassword123!',
      });

    expect(resA.statusCode).toBe(201);
    tenantA.id = resA.body.data.tenant.id;
    tenantA.email = `admin.a.${uniqueSuffix}@bofa.com`;

    const resB = await request(app)
      .post('/api/v1/auth/register')
      .send({
        tenantName: `HDFC Test ${uniqueSuffix}`,
        email: `admin.b.${uniqueSuffix}@hdfc.com`,
        password: 'StrongPassword123!',
      });

    expect(resB.statusCode).toBe(201);
    tenantB.id = resB.body.data.tenant.id;
    tenantB.email = `admin.b.${uniqueSuffix}@hdfc.com`;
  });

  test('3. Enforces Refresh Token Rotation and Reuse Detection (Revokes all sessions on replay)', async () => {
   
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      tenantId: tenantA.id,
      email: tenantA.email,
      password: 'StrongPassword123!',
    });

    expect(loginRes.statusCode).toBe(200);
    const firstRefreshToken = loginRes.body.data.refreshToken;

    
    const refresh1 = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: firstRefreshToken });

    expect(refresh1.statusCode).toBe(200);
    const secondRefreshToken = refresh1.body.data.refreshToken;
    expect(secondRefreshToken).not.toBe(firstRefreshToken);

   
    const replayRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: firstRefreshToken });

    expect(replayRes.statusCode).toBe(401);
    expect(replayRes.body.message).toMatch(/reuse detected/i);

    
    const afterBreachRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: secondRefreshToken });

    expect(afterBreachRes.statusCode).toBe(401);

   
    const reloginA = await request(app).post('/api/v1/auth/login').send({
      tenantId: tenantA.id,
      email: tenantA.email,
      password: 'StrongPassword123!',
    });
    tenantA.accessToken = reloginA.body.data.accessToken;

    const loginB = await request(app).post('/api/v1/auth/login').send({
      tenantId: tenantB.id,
      email: tenantB.email,
      password: 'StrongPassword123!',
    });
    tenantB.accessToken = loginB.body.data.accessToken;
  });

  test('4. Enforces Intra-Tenant Granular RBAC (VIEWER gets 200 on Read, 403 on Write/Admin)', async () => {
   
    const customerRes = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${tenantA.accessToken}`)
      .send({
        name: 'Priya Corporate',
        email: `priya.${uniqueSuffix}@corp.com`,
        phone: '9876543210',
        nationalId: `PAN${uniqueSuffix}`,
      });

    expect(customerRes.statusCode).toBe(201);
    customerAId = customerRes.body.data.id;

    
    const createViewerRes = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${tenantA.accessToken}`)
      .send({
        email: `viewer.${uniqueSuffix}@bofa.com`,
        password: 'ViewerPassword123!',
      });

    expect(createViewerRes.statusCode).toBe(201);
    expect(createViewerRes.body.data.roles).toContain('VIEWER');

   
    const viewerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        tenantId: tenantA.id,
        email: `viewer.${uniqueSuffix}@bofa.com`,
        password: 'ViewerPassword123!',
      });

    viewerTokenA = viewerLogin.body.data.accessToken;

    
    const readRes = await request(app)
      .get('/api/v1/customers')
      .set('Authorization', `Bearer ${viewerTokenA}`);
    expect(readRes.statusCode).toBe(200);
    expect(readRes.body.count).toBe(1);

    
    const deleteRes = await request(app)
      .delete(`/api/v1/customers/${customerAId}`)
      .set('Authorization', `Bearer ${viewerTokenA}`);
    expect(deleteRes.statusCode).toBe(403);

   
    const usersRes = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${viewerTokenA}`);
    expect(usersRes.statusCode).toBe(403);
  });

  test('5. Prevents Cross-Tenant BOLA / IDOR Attacks (Tenant B ADMIN cannot access Tenant A Customer)', async () => {
  
    const bolaGet = await request(app)
      .get(`/api/v1/customers/${customerAId}`)
      .set('Authorization', `Bearer ${tenantB.accessToken}`);

    expect(bolaGet.statusCode).toBe(404);

   
    const bolaDelete = await request(app)
      .delete(`/api/v1/customers/${customerAId}`)
      .set('Authorization', `Bearer ${tenantB.accessToken}`);

    expect(bolaDelete.statusCode).toBe(404);
  });

  test('6. Verifies Cryptographic SHA-256 Hash Chain Integrity of Tenant A Audit Logs', async () => {
    const verifyRes = await request(app)
      .get('/api/v1/audit-logs/verify')
      .set('Authorization', `Bearer ${tenantA.accessToken}`);

    expect(verifyRes.statusCode).toBe(200);
    expect(verifyRes.body.data.valid).toBe(true);
    expect(verifyRes.body.data.totalLogsVerified).toBeGreaterThanOrEqual(2);
  });
});