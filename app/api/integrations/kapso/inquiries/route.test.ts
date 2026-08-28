import { describe, it, expect, beforeEach, vi } from 'vitest';

let mockUpsertResult: { data: unknown; error: unknown } = { data: { id: 'row-1' }, error: null };
const upsertSpy = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      upsert: (row: unknown, opts: unknown) => {
        upsertSpy(row, opts);
        return {
          select: () => ({
            maybeSingle: async () => mockUpsertResult,
          }),
        };
      },
    }),
  }),
}));

import { POST } from '@/app/api/integrations/kapso/inquiries/route';

const SECRET = 'test-secret-123';
const VALID_BODY = {
  whatsapp: '0981 000 000',
  kind: 'alquiler',
  nombre: 'Ana',
  resumen: 'Quiere alquilar un salón en planta alta para ropa',
  conversationId: 'conv-1',
  messageId: 'msg-1',
};

function makeReq(body: unknown, secret?: string): Request {
  return new Request('http://localhost/api/integrations/kapso/inquiries', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(secret ? { 'x-kapso-webhook-secret': secret } : {}),
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  upsertSpy.mockClear();
  mockUpsertResult = { data: { id: 'row-1' }, error: null };
  process.env.KAPSO_WEBHOOK_SECRET = SECRET;
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
});

describe('POST /api/integrations/kapso/inquiries', () => {
  it('consulta válida: 200, upsert idempotente, phone normalizado y kind mapeado', async () => {
    const res = await POST(makeReq(VALID_BODY, SECRET));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.id).toBe('row-1');

    const [row, opts] = upsertSpy.mock.calls[0];
    expect((opts as { onConflict: string }).onConflict).toBe('source,conversation_id,message_id');
    expect((row as { source: string }).source).toBe('kapso');
    expect((row as { phone: string }).phone).toBe('595981000000');
    expect((row as { kind: string }).kind).toBe('alquiler');
    expect((row as { message: string }).message).toBe(VALID_BODY.resumen);
    expect((row as { status: string }).status).toBe('new');
  });

  it('secreto incorrecto: 401 y no toca Supabase', async () => {
    const res = await POST(makeReq(VALID_BODY, 'wrong'));
    expect(res.status).toBe(401);
    expect(upsertSpy).not.toHaveBeenCalled();
  });

  it('kind inválido (producto va a /pedidos, no acá): 422', async () => {
    const res = await POST(makeReq({ ...VALID_BODY, kind: 'producto' }, SECRET));
    expect(res.status).toBe(422);
  });

  it('sin resumen: 422', async () => {
    const { resumen, ...bad } = VALID_BODY;
    void resumen;
    const res = await POST(makeReq(bad, SECRET));
    expect(res.status).toBe(422);
  });

  it('acepta null en nombre (el LLM no siempre lo captura): 200 y name null', async () => {
    const res = await POST(makeReq({ ...VALID_BODY, nombre: null }, SECRET));
    expect(res.status).toBe(200);
    const [row] = upsertSpy.mock.calls[0];
    expect((row as { name: unknown }).name).toBeNull();
  });

  it('Supabase falla: 502 controlado', async () => {
    mockUpsertResult = { data: null, error: { message: 'db down' } };
    const res = await POST(makeReq(VALID_BODY, SECRET));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe('storage_error');
  });
});
