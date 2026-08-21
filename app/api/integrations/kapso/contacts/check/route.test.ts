import { describe, it, expect, beforeEach, vi } from 'vitest';

let mockSelectResult: { data: unknown; error: unknown } = { data: null, error: null };

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => mockSelectResult,
        }),
      }),
    }),
  }),
}));

import { POST } from '@/app/api/integrations/kapso/contacts/check/route';

const SECRET = 'test-secret-123';

function makeReq(body: unknown, secret?: string): Request {
  return new Request('http://localhost/api/integrations/kapso/contacts/check', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(secret ? { 'x-kapso-webhook-secret': secret } : {}),
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mockSelectResult = { data: null, error: null };
  process.env.KAPSO_WEBHOOK_SECRET = SECRET;
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
});

describe('POST /api/integrations/kapso/contacts/check', () => {
  it('número agendado: known=true', async () => {
    mockSelectResult = { data: { id: 'c-1' }, error: null };
    const res = await POST(makeReq({ whatsapp: '595981000000' }, SECRET));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.known).toBe(true);
  });

  it('número NO agendado: known=false', async () => {
    mockSelectResult = { data: null, error: null };
    const res = await POST(makeReq({ whatsapp: '595982222222' }, SECRET));
    const body = await res.json();
    expect(body.known).toBe(false);
  });

  it('secreto incorrecto: 401', async () => {
    const res = await POST(makeReq({ whatsapp: '595981000000' }, 'wrong'));
    expect(res.status).toBe(401);
  });

  it('payload inválido (sin whatsapp): 422', async () => {
    const res = await POST(makeReq({}, SECRET));
    expect(res.status).toBe(422);
  });

  it('Supabase caído: fail-open known=false, degraded=true, 200', async () => {
    mockSelectResult = { data: null, error: { message: 'db down' } };
    const res = await POST(makeReq({ whatsapp: '595981000000' }, SECRET));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.known).toBe(false);
    expect(body.degraded).toBe(true);
  });

  it('sin config de Supabase: fail-open (no rompe)', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const res = await POST(makeReq({ whatsapp: '595981000000' }, SECRET));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.known).toBe(false);
    expect(body.degraded).toBe(true);
  });
});
