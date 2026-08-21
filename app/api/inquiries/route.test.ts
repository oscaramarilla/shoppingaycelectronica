import { describe, it, expect, beforeEach, vi } from 'vitest';

let mockInsertResult: { data: unknown; error: unknown } = { data: { id: 'inq-1' }, error: null };
const insertSpy = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      insert: (row: unknown) => {
        insertSpy(row);
        return { select: () => ({ maybeSingle: async () => mockInsertResult }) };
      },
    }),
  }),
}));

import { POST } from '@/app/api/inquiries/route';

const VALID = { kind: 'producto', name: 'Ana', phone: '0981000000', message: '¿Tenés iPhone 13?' };

function makeReq(body: unknown): Request {
  return new Request('http://localhost/api/inquiries', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  insertSpy.mockClear();
  mockInsertResult = { data: { id: 'inq-1' }, error: null };
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
});

describe('POST /api/inquiries', () => {
  it('consulta válida: 200 + id, status new', async () => {
    const res = await POST(makeReq(VALID));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.id).toBe('inq-1');
    expect((insertSpy.mock.calls[0][0] as { status: string }).status).toBe('new');
  });

  it('kind inválido: 422', async () => {
    const res = await POST(makeReq({ ...VALID, kind: 'otro' }));
    expect(res.status).toBe(422);
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it('faltan campos: 422', async () => {
    const res = await POST(makeReq({ kind: 'producto' }));
    expect(res.status).toBe(422);
  });

  it('Supabase falla: 502', async () => {
    mockInsertResult = { data: null, error: { message: 'db down' } };
    const res = await POST(makeReq(VALID));
    expect(res.status).toBe(502);
  });

  it('sin config: 503', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const res = await POST(makeReq(VALID));
    expect(res.status).toBe(503);
  });
});
