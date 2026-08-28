import type {
  BusinessProfileDetail,
  CatalogAvailability,
  CatalogItem,
  CategoryDirectory,
} from "./types";

const SHOPPING_ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: "P92H+J7H, Mayor Fleitas esquina, Zona Mercado 4",
  postalCode: "001224",
  addressLocality: "Asunción",
  addressRegion: "Asunción",
  addressCountry: "PY",
};

const schemaAvailability: Record<CatalogAvailability, string> = {
  in_stock: "https://schema.org/InStock",
  limited: "https://schema.org/LimitedAvailability",
  on_request: "https://schema.org/PreOrder",
  service_available: "https://schema.org/InStock",
};

export function getMarketplaceSiteUrl() {
  const fallback = "https://www.shoppingaycelectronica.com";
  try {
    return new URL(process.env.SITE_URL ?? fallback).toString().replace(/\/$/, "");
  } catch {
    return fallback;
  }
}

function buildItemSchema(item: CatalogItem, pageUrl: string, providerId: string) {
  const schema: Record<string, unknown> = {
    "@type": item.kind === "product" ? "Product" : "Service",
    "@id": `${pageUrl}#${item.kind}-${item.slug}`,
    name: item.name,
    description: item.summary,
    category: item.categorySlug,
    url: `${pageUrl}#${item.slug}`,
  };

  if (item.kind === "service") {
    schema.provider = { "@id": providerId };
  }

  if (item.priceAmount !== null && item.priceType !== "quote") {
    schema.offers = {
      "@type": "Offer",
      price: item.priceAmount,
      priceCurrency: item.priceCurrency,
      availability: schemaAvailability[item.availability],
      url: `${pageUrl}#${item.slug}`,
      seller: { "@id": providerId },
    };
  }

  return schema;
}

export function buildBusinessProfileJsonLd(detail: BusinessProfileDetail) {
  const siteUrl = getMarketplaceSiteUrl();
  const { profile, category, catalogItems } = detail;
  const pageUrl = `${siteUrl}/locales/${profile.slug}`;
  const providerId = `${pageUrl}#business`;

  const businessSchema: Record<string, unknown> = {
    "@type": "LocalBusiness",
    "@id": providerId,
    name: profile.publicName,
    description: profile.description,
    url: pageUrl,
    image: `${siteUrl}/images/shopping-ayc-fachada.png`,
    address: SHOPPING_ADDRESS,
    areaServed: { "@type": "City", name: "Asunción" },
    containedInPlace: {
      "@type": "ShoppingCenter",
      "@id": `${siteUrl}/#shopping-center`,
      name: "Shopping AYC Electrónica",
    },
    knowsAbout: profile.specialties,
  };

  if (profile.publicWhatsapp) {
    businessSchema.telephone = `+${profile.publicWhatsapp.replace(/\D/g, "")}`;
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      businessSchema,
      ...catalogItems.map((item) => buildItemSchema(item, pageUrl, providerId)),
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: siteUrl },
          {
            "@type": "ListItem",
            position: 2,
            name: category.name,
            item: `${siteUrl}/categorias/${category.slug}`,
          },
          { "@type": "ListItem", position: 3, name: profile.publicName, item: pageUrl },
        ],
      },
    ],
  };
}

export function buildCategoryJsonLd(directory: CategoryDirectory) {
  const siteUrl = getMarketplaceSiteUrl();
  const pageUrl = `${siteUrl}/categorias/${directory.category.slug}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#collection`,
        name: `${directory.category.name} en Shopping AYC`,
        description: directory.category.description,
        url: pageUrl,
        inLanguage: "es-PY",
        isPartOf: { "@type": "WebSite", "@id": `${siteUrl}/#website` },
        mainEntity: { "@id": `${pageUrl}#business-list` },
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#business-list`,
        numberOfItems: directory.profiles.length,
        itemListElement: directory.profiles.map((profile, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: profile.publicName,
          url: `${siteUrl}/locales/${profile.slug}`,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: siteUrl },
          { "@type": "ListItem", position: 2, name: directory.category.name, item: pageUrl },
        ],
      },
    ],
  };
}

/** Evita que contenido futuro cierre el script JSON-LD antes de tiempo. */
export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
