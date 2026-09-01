export type CatalogItemKind = "product" | "service";

export type CatalogPriceType = "fixed" | "from" | "quote";

export type CatalogAvailability =
  | "in_stock"
  | "limited"
  | "on_request"
  | "service_available";

/**
 * Proyección pública futura de `business_profiles`.
 *
 * No agregar nombre legal, alquiler, expensa, teléfono contractual ni ningún
 * otro dato privado de `units` o del contrato de ocupación.
 */
export type BusinessProfile = {
  id: string;
  slug: string;
  publicName: string;
  categorySlug: string;
  summary: string;
  description: string;
  specialties: string[];
  unitCodes: string[];
  floorLabel: string;
  locationHint: string;
  publicWhatsapp: string | null;
  hoursLabel: string;
  isPublished: boolean;
  isDemo: boolean;
  verifiedAt: string | null;
};

/** Proyección pública futura de `catalog_items`. */
export type CatalogItem = {
  id: string;
  slug: string;
  businessProfileId: string;
  kind: CatalogItemKind;
  name: string;
  summary: string;
  categorySlug: string;
  priceType: CatalogPriceType;
  priceAmount: number | null;
  priceCurrency: "PYG";
  availability: CatalogAvailability;
  attributes: string[];
  isPublished: boolean;
  isDemo: boolean;
  verifiedAt: string | null;
};

export type MarketplaceCategory = {
  slug: string;
  name: string;
  shortName: string;
  eyebrow: string;
  description: string;
  searchIntent: string;
  buyerQuestions: string[];
};

export type BusinessProfileDetail = {
  profile: BusinessProfile;
  category: MarketplaceCategory;
  catalogItems: CatalogItem[];
  relatedProfiles: BusinessProfile[];
};

export type CategoryDirectory = {
  category: MarketplaceCategory;
  profiles: BusinessProfile[];
  catalogItems: CatalogItem[];
  otherCategories: MarketplaceCategory[];
  isDemo: boolean;
};
