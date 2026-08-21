import { beforeEach, describe, expect, it, vi } from "vitest";

let mockResult: { data: unknown; error: unknown } = {
  data: { id: "85c5028f-4ed5-4a5a-b423-0c7a7f433111", status: "paid" },
  error: null,
};
const updateSpy = vi.fn();
const idSpy = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({
      update: (changes: unknown) => {
        updateSpy(changes);
        return {
          eq: (_field: string, id: string) => {
            idSpy(id);
            return {
              select: () => ({
                maybeSingle: async () => mockResult,
              }),
            };
          },
        };
      },
    }),
  }),
}));

import { PATCH } from "@/app/api/admin/payments/[id]/route";

const paymentId = "85c5028f-4ed5-4a5a-b423-0c7a7f433111";

function request(body: unknown) {
  return new Request(`http://localhost/api/admin/payments/${paymentId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  updateSpy.mockClear();
  idSpy.mockClear();
  mockResult = { data: { id: paymentId, status: "paid" }, error: null };
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
});

describe("PATCH /api/admin/payments/[id]", () => {
  it("marca un UUID válido como pagado y agrega la fecha", async () => {
    const response = await PATCH(
      request({ status: "paid", method: "Efectivo" }),
      { params: Promise.resolve({ id: paymentId }) },
    );

    expect(response.status).toBe(200);
    expect(idSpy).toHaveBeenCalledWith(paymentId);
    expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({
      status: "paid",
      method: "Efectivo",
      paid_on: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    }));
  });

  it("rechaza IDs de interfaz que no sean UUID", async () => {
    const response = await PATCH(
      request({ status: "paid" }),
      { params: Promise.resolve({ id: "PB-01" }) },
    );

    expect(response.status).toBe(422);
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it("rechaza estados fuera del contrato", async () => {
    const response = await PATCH(
      request({ status: "cancelled" }),
      { params: Promise.resolve({ id: paymentId }) },
    );

    expect(response.status).toBe(422);
    expect(updateSpy).not.toHaveBeenCalled();
  });
});
