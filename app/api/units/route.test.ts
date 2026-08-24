import { describe, it, expect, beforeEach, vi } from 'vitest';

let mockResult: { data: unknown; error: unknown } = { data: [], error: null };
const selectSpy = vi.fn();

vi.mock('@supabase/supabase-js', () => {
  const makeBuilder = () => {
    const b: Record<string, unknown> = {};
    b.select = (cols: string) => {
      selectSpy(cols);
      return b;
    };
    b.eq = () => b;
    b.ilike = () => b;
    b.order = () => Promise.resolve(mockResult);
    return b;
  };
  return { createClient: () => ({ from: () => makeBuilder() }) };
});

import { GET } from '@/app/api/units/route';

function makeReq(qs = ''): Request {
  return new Request('http://localhost/api/units' + (qs ? `?${qs}` : ''));
}

beforeEach(() => {
  selectSpy.mockClear();
  mockResult = { data: [], error: null };
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
});

describe('GET /api/units', () => {
  it('devuelve units con la proyección segura (sin campos financieros/PII)', async () => {
    mockResult = {
      data: [
        { id: 'u1', code: 'A-12', floor: '1', status: 'occupied', tenant_name: 'Kiosco X', category: 'celulares' },
      ],
      error: null,
    };
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.units).toHaveLength(1);
    const cols = selectSpy.mock.calls[0][0] as string;
    expect(cols).not.toMatch(/monthly_rent|due_day|phone/);
    expect(cols).toContain('code');
  });

  it('status inválido en query: 422', async () => {
    const res = await GET(makeReq('status=vendido'));
    expect(res.status).toBe(422);
  });

  it('sin config de Supabase: 503', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const res = await GET(makeReq());
    expect(res.status).toBe(503);
  });

  it('error de Supabase: 502', async () => {
    mockResult = { data: null, error: { message: 'db down' } };
    const res = await GET(makeReq());
    expect(res.status).toBe(502);
  });
});
