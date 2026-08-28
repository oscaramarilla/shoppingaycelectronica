import type { CatalogAvailability, CatalogItem } from "./types";

const availabilityLabels: Record<CatalogAvailability, string> = {
  in_stock: "Disponible",
  limited: "Disponibilidad limitada",
  on_request: "A confirmar",
  service_available: "Agenda disponible",
};

export function formatCatalogPrice(item: CatalogItem) {
  if (item.priceType === "quote" || item.priceAmount === null) {
    return "Solicitar cotización";
  }

  const amount = new Intl.NumberFormat("es-PY").format(item.priceAmount);
  return `${item.priceType === "from" ? "Desde " : ""}Gs. ${amount}`;
}

export function formatAvailability(availability: CatalogAvailability) {
  return availabilityLabels[availability];
}

export function buildMarketplaceInquiryHref(subject: string) {
  const parameters = new URLSearchParams({
    kind: "producto",
    message: `Quiero consultar por ${subject}.`,
  });
  return `/?${parameters.toString()}#contacto`;
}

export function buildWhatsappHref(phone: string, subject: string) {
  const normalizedPhone = phone.replace(/\D/g, "");
  const message = encodeURIComponent(
    `Hola, vi ${subject} en el marketplace de Shopping AYC y quiero más información.`,
  );
  return `https://wa.me/${normalizedPhone}?text=${message}`;
}
