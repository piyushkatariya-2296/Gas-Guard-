import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

describe('API Healthcheck & Setup Tests', () => {
  it('GET /api/health should return status UP', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('UP');
    expect(res.body.system).toContain('GasGuard');
  });
});
