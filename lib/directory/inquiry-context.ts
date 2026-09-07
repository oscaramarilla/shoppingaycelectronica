export const PUBLIC_INQUIRY_KINDS = ["alquiler", "producto", "comerciante"] as const;

export type PublicInquiryKind = (typeof PUBLIC_INQUIRY_KINDS)[number];

export type PublicInquiryContext = {
  kind: PublicInquiryKind;
  message: string;
};

type InquirySearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : value?.[0];
}

function isInquiryKind(value: string | undefined): value is PublicInquiryKind {
  return typeof value === "string" && PUBLIC_INQUIRY_KINDS.includes(value as PublicInquiryKind);
}

/** Lee únicamente los parámetros públicos que puede precargar el formulario. */
export function readPublicInquiryContext(searchParams: InquirySearchParams): PublicInquiryContext {
  const kind = firstValue(searchParams.kind);
  const message = firstValue(searchParams.message)?.trim().slice(0, 4000) ?? "";

  return {
    kind: isInquiryKind(kind) ? kind : "alquiler",
    message,
  };
}

/** Conserva el contexto al volver a la portada desde una ficha o una vacancia. */
export function buildPublicInquiryHref(context: PublicInquiryContext) {
  const parameters = new URLSearchParams({ kind: context.kind });
  if (context.message) parameters.set("message", context.message);
  return `/?${parameters.toString()}#contacto`;
}
