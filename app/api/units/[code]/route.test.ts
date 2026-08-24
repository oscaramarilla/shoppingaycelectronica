import { describe, it, expect, beforeEach, vi } from 'vitest';

let mockResult: { data: unknown; error: unknown } = { data: null, error: null };
const selectSpy = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      select: (cols: string) => {
        selectSpy(cols);
        return { eq: () => ({ maybeSingle: async () => mockResult }) };
      },
    }),
  }),
}));

import { GET } from '@/app/api/units/[code]/route';

function ctx(code: string) {
  return { params: Promise.resolve({ code }) };
}
const req = new Request('http://localhost/api/units/A-12');

beforeEach(() => {
  selectSpy.mockClear();
  mockResult = { data: null, error: null };
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
});

describe('GET /api/units/[code]', () => {
  it('local existente: 200 + unit con proyección segura', async () => {
    mockResult = {
      data: { id: 'u1', code: 'A-12', floor: '1', status: 'occupied', tenant_name: 'Kiosco X', category: 'celulares' },
      error: null,
    };
    const res = await GET(req, ctx('A-12'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.unit.code).toBe('A-12');
    const cols = selectSpy.mock.calls[0][0] as string;
    expect(cols).not.toMatch(/monthly_rent|due_day|phone/);
  });

  it('local inexistente: 404', async () => {
    mockResult = { data: null, error: null };
    const res = await GET(req, ctx('Z-99'));
    expect(res.status).toBe(404);
  });

  it('code vacío: 400 y no toca Supabase', async () => {
    const res = await GET(req, ctx('   '));
    expect(res.status).toBe(400);
    expect(selectSpy).not.toHaveBeenCalled();
  });

  it('error de Supabase: 502', async () => {
    mockResult = { data: null, error: { message: 'db down' } };
    const res = await GET(req, ctx('A-12'));
    expect(res.status).toBe(502);
  });

  it('sin config de Supabase: 503', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const res = await GET(req, ctx('A-12'));
    expect(res.status).toBe(503);
  });
});
