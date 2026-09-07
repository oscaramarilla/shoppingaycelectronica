import { describe, expect, it } from "vitest";
import {
  buildPublicInquiryHref,
  readPublicInquiryContext,
} from "@/lib/directory/inquiry-context";

describe("contexto de consulta pública", () => {
  it("conserva producto y tipo al volver a la portada", () => {
    const href = buildPublicInquiryHref({
      kind: "producto",
      message: "Quiero consultar por un celular.",
    });

    expect(href).toBe("/?kind=producto&message=Quiero+consultar+por+un+celular.#contacto");
    expect(readPublicInquiryContext({
      kind: "producto",
      message: "Quiero consultar por un celular.",
    })).toEqual({
      kind: "producto",
      message: "Quiero consultar por un celular.",
    });
  });

  it("rechaza tipos no reconocidos y limita el mensaje recibido por URL", () => {
    expect(readPublicInquiryContext({ kind: "otro", message: "  PB-11  " })).toEqual({
      kind: "alquiler",
      message: "PB-11",
    });
    expect(readPublicInquiryContext({ message: "x".repeat(4001) }).message).toHaveLength(4000);
  });
});
