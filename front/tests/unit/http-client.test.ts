// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { HttpClient } from '../../src/services/http/http-client';
import { AppError } from '../../src/shared/errors';

function response(status: number, body?: unknown, headers: Record<string, string> = {}): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

describe('HttpClient', () => {
  it('normalise un 404 de ressource et un 404 de route différemment (règle 19)', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValueOnce(response(404)).mockResolvedValueOnce(response(404, undefined, { 'X-Route-Missing': '1' }));
    const client = new HttpClient({ baseUrl: 'http://api', fetchImpl });
    await expect(client.get('/assets/x')).rejects.toMatchObject({ kind: 'resource-missing' });
    await expect(client.get('/new-feature')).rejects.toMatchObject({ kind: 'route-missing' });
  });

  it("transmet le message d'un refus métier, et jamais celui d'une panne", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(409, { message: 'Ce bail est déjà actif.', reference: 'AB12CD' }))
      .mockResolvedValueOnce(response(500, { message: 'NullPointerException at Foo.java:42' }));
    const client = new HttpClient({ baseUrl: 'http://api', fetchImpl });
    const business = await client.post('/leases', {}).catch((e: unknown) => AppError.from(e));
    expect(business).toMatchObject({ kind: 'business', userMessage: 'Ce bail est déjà actif.', reference: 'AB12CD' });
    const crash = await client.post('/leases', {}).catch((e: unknown) => AppError.from(e));
    expect(crash).toMatchObject({ kind: 'unexpected', userMessage: undefined });
  });

  it('met en file les requêtes concurrentes pendant un rafraîchissement (règle 16)', async () => {
    const refreshToken = vi.fn().mockResolvedValue('fresh');
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation(async (_url, init) => {
      const auth = (init?.headers as Record<string, string>).Authorization;
      return auth === 'Bearer fresh' ? response(200, { ok: true }) : response(401);
    });
    const client = new HttpClient({ baseUrl: 'http://api', fetchImpl, refreshToken });
    const results = await Promise.all([client.get('/a'), client.get('/b'), client.get('/c')]);
    expect(results).toEqual([{ ok: true }, { ok: true }, { ok: true }]);
    expect(refreshToken).toHaveBeenCalledTimes(1);
  });
});
