import { describe, it, expect, beforeEach, vi } from 'vitest';

let mockUser: { id: string } | null = { id: 'admin-1' };
vi.mock('@/lib/supabase/auth', () => ({ getCurrentUser: async () => mockUser }));

let mockResult: { data: unknown; error: unknown } = { data: { id: 'u1' }, error: null };
const opSpy = vi.fn();
vi.mock('@supabase/supabase-js', () => {
  const builder = () => {
    const b: Record<string, unknown> = {};
    b.select = () => b;
    b.insert = (r: unknown) => { opSpy('insert', r); return b; };
    b.update = (r: unknown) => { opSpy('update', r); return b; };
    b.eq = () => b;
    b.order = () => Promise.resolve(mockResult);
    b.maybeSingle = async () => mockResult;
    b.then = (resolve: (v: unknown) => unknown) => resolve(mockResult);
    return b;
  };
  return { createClient: () => ({ from: () => builder() }) };
});

import { GET, POST } from '@/app/api/admin/units/route';
import { PATCH } from '@/app/api/admin/units/[id]/route';

function req(body?: unknown): Request {
  return new Request('http://localhost/api/admin/units', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const VALID = { code: 'A-12', floor: '1', status: 'occupied', monthly_rent: 1500000, due_day: 10 };

beforeEach(() => {
  mockUser = { id: 'admin-1' };
  mockResult = { data: { id: 'u1' }, error: null };
  opSpy.mockClear();
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
});

describe('/api/admin/units', () => {
  it('GET sin sesión: 401', async () => {
    mockUser = null;
    expect((await GET()).status).toBe(401);
  });
  it('POST sin sesión: 401 y no toca la DB', async () => {
    mockUser = null;
    const res = await POST(req(VALID));
    expect(res.status).toBe(401);
    expect(opSpy).not.toHaveBeenCalled();
  });
  it('GET autenticado: 200', async () => {
    mockResult = { data: [{ id: 'u1', code: 'A-12' }], error: null };
    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });
  it('POST válido: 201 + id', async () => {
    const res = await POST(req(VALID));
    expect(res.status).toBe(201);
    expect((await res.json()).id).toBe('u1');
    expect(opSpy).toHaveBeenCalledWith('insert', expect.objectContaining({ code: 'A-12' }));
  });
  it('POST status inválido: 422', async () => {
    expect((await POST(req({ ...VALID, status: 'vendido' }))).status).toBe(422);
  });
  it('PATCH válido: 200', async () => {
    expect((await PATCH(req({ status: 'available' }), ctx('u1'))).status).toBe(200);
  });
  it('PATCH sin cambios: 422', async () => {
    expect((await PATCH(req({}), ctx('u1'))).status).toBe(422);
  });
  it('PATCH inexistente: 404', async () => {
    mockResult = { data: null, error: null };
    expect((await PATCH(req({ status: 'available' }), ctx('nope'))).status).toBe(404);
  });
});
