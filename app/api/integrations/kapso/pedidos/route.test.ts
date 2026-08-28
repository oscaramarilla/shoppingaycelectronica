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

import { POST } from '@/app/api/integrations/kapso/pedidos/route';

const SECRET = 'test-secret-123';
const VALID_BODY = {
  whatsapp: '0981 000 000',
  nombre: 'Ana',
  producto: 'iPhone 13',
  marcaModelo: 'Apple iPhone 13 128GB',
  cantidad: 1,
  urgencia: 'alta',
  entrega: 'Ciudad del Este',
  resumen: 'Quiere un iPhone 13 hoy',
  conversationId: 'conv-1',
  messageId: 'msg-1',
};

function makeReq(body: unknown, secret?: string): Request {
  return new Request('http://localhost/api/integrations/kapso/pedidos', {
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

describe('POST /api/integrations/kapso/pedidos', () => {
  it('pedido válido: 200, upsert idempotente y whatsapp normalizado', async () => {
    const res = await POST(makeReq(VALID_BODY, SECRET));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.id).toBe('row-1');

    const [row, opts] = upsertSpy.mock.calls[0];
    expect((opts as { onConflict: string }).onConflict).toBe('source,conversation_id,message_id');
    expect((row as { source: string }).source).toBe('kapso');
    expect((row as { whatsapp: string }).whatsapp).toBe('595981000000');
    expect((row as { estado: string }).estado).toBe('nuevo');
  });

  it('acepta null en campos opcionales (el LLM emite null para lo que no dijeron): 200', async () => {
    const body = {
      ...VALID_BODY,
      nombre: null,
      marcaModelo: null,
      cantidad: null,
      urgencia: null,
      entrega: null,
      resumen: null,
    };
    const res = await POST(makeReq(body, SECRET));
    expect(res.status).toBe(200);
    const [row] = upsertSpy.mock.calls[0];
    expect((row as { marca_modelo: unknown }).marca_modelo).toBeNull();
    expect((row as { cantidad: unknown }).cantidad).toBeNull();
  });

  it('secreto incorrecto: 401 y no toca Supabase', async () => {
    const res = await POST(makeReq(VALID_BODY, 'wrong'));
    expect(res.status).toBe(401);
    expect(upsertSpy).not.toHaveBeenCalled();
  });

  it('payload inválido (sin producto): 422', async () => {
    const { producto, ...bad } = VALID_BODY;
    void producto;
    const res = await POST(makeReq(bad, SECRET));
    expect(res.status).toBe(422);
  });

  it('Supabase falla: 502 controlado', async () => {
    mockUpsertResult = { data: null, error: { message: 'db down' } };
    const res = await POST(makeReq(VALID_BODY, SECRET));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe('storage_error');
  });
});
