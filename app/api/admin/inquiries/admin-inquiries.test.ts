import { describe, it, expect, beforeEach, vi } from 'vitest';

let mockUser: { id: string } | null = { id: 'admin-1' };
vi.mock('@/lib/supabase/auth', () => ({ getCurrentUser: async () => mockUser }));

let mockResult: { data: unknown; error: unknown } = { data: { id: 'i1' }, error: null };
const opSpy = vi.fn();
vi.mock('@supabase/supabase-js', () => {
  const builder = () => {
    const b: Record<string, unknown> = {};
    b.select = () => b;
    b.update = (r: unknown) => { opSpy('update', r); return b; };
    b.eq = () => b;
    b.order = () => Promise.resolve(mockResult);
    b.maybeSingle = async () => mockResult;
    b.then = (resolve: (v: unknown) => unknown) => resolve(mockResult);
    return b;
  };
  return { createClient: () => ({ from: () => builder() }) };
});

import { GET } from '@/app/api/admin/inquiries/route';
import { PATCH } from '@/app/api/admin/inquiries/[id]/route';

function req(body?: unknown): Request {
  return new Request('http://localhost/api/admin/inquiries', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  mockUser = { id: 'admin-1' };
  mockResult = { data: { id: 'i1' }, error: null };
  opSpy.mockClear();
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
});

describe('/api/admin/inquiries', () => {
  it('GET sin sesión: 401', async () => {
    mockUser = null;
    expect((await GET(req())).status).toBe(401);
  });
  it('GET autenticado: 200', async () => {
    mockResult = { data: [{ id: 'i1', status: 'new' }], error: null };
    expect((await GET(req())).status).toBe(200);
  });
  it('PATCH status válido: 200', async () => {
    const res = await PATCH(req({ status: 'contacted' }), ctx('i1'));
    expect(res.status).toBe(200);
    expect(opSpy).toHaveBeenCalledWith('update', { status: 'contacted' });
  });
  it('PATCH status inválido: 422', async () => {
    expect((await PATCH(req({ status: 'archivado' }), ctx('i1'))).status).toBe(422);
  });
  it('PATCH inexistente: 404', async () => {
    mockResult = { data: null, error: null };
    expect((await PATCH(req({ status: 'closed' }), ctx('nope'))).status).toBe(404);
  });
});
