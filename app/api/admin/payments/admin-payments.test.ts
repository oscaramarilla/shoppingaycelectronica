import { describe, it, expect, beforeEach, vi } from 'vitest';

let mockUser: { id: string } | null = { id: 'admin-1' };
vi.mock('@/lib/supabase/auth', () => ({ getCurrentUser: async () => mockUser }));

let mockResult: { data: unknown; error: unknown } = { data: { id: 'p1' }, error: null };
const opSpy = vi.fn();
vi.mock('@supabase/supabase-js', () => {
  const builder = () => {
    const b: Record<string, unknown> = {};
    b.select = () => b;
    b.upsert = (r: unknown, o: unknown) => { opSpy('upsert', r, o); return b; };
    b.update = (r: unknown) => { opSpy('update', r); return b; };
    b.eq = () => b;
    b.order = () => Promise.resolve(mockResult);
    b.maybeSingle = async () => mockResult;
    b.then = (resolve: (v: unknown) => unknown) => resolve(mockResult);
    return b;
  };
  return { createClient: () => ({ from: () => builder() }) };
});

import { GET, POST } from '@/app/api/admin/payments/route';
import { PATCH } from '@/app/api/admin/payments/[id]/route';

function req(body?: unknown): Request {
  return new Request('http://localhost/api/admin/payments', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const UNIT_UUID = '00000000-0000-0000-0000-000000000001';
const VALID = { unit_id: UNIT_UUID, period: '2026-08', amount: 1500000, status: 'due' };

beforeEach(() => {
  mockUser = { id: 'admin-1' };
  mockResult = { data: { id: 'p1' }, error: null };
  opSpy.mockClear();
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
});

describe('/api/admin/payments', () => {
  it('GET sin sesión: 401', async () => {
    mockUser = null;
    expect((await GET(req())).status).toBe(401);
  });
  it('GET autenticado: 200', async () => {
    mockResult = { data: [{ id: 'p1', period: '2026-08' }], error: null };
    expect((await GET(req())).status).toBe(200);
  });
  it('POST upsert válido: 200 con onConflict unit_id,period', async () => {
    const res = await POST(req(VALID));
    expect(res.status).toBe(200);
    expect((await res.json()).id).toBe('p1');
    const [, , opts] = opSpy.mock.calls[0];
    expect((opts as { onConflict: string }).onConflict).toBe('unit_id,period');
  });
  it('POST period inválido: 422', async () => {
    expect((await POST(req({ ...VALID, period: 'agosto' }))).status).toBe(422);
  });
  it('POST unit_id no-uuid: 422', async () => {
    expect((await POST(req({ ...VALID, unit_id: 'abc' }))).status).toBe(422);
  });
  it('PATCH marcar pagado: 200 y setea paid_on', async () => {
    const res = await PATCH(req({ status: 'paid' }), ctx('p1'));
    expect(res.status).toBe(200);
    const [, patch] = opSpy.mock.calls[0];
    expect((patch as { paid_on?: string }).paid_on).toBeTruthy();
  });
  it('PATCH sin campos: 422', async () => {
    expect((await PATCH(req({}), ctx('p1'))).status).toBe(422);
  });
});
