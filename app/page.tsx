import PublicMarketplace from "./PublicMarketplace";
import { summarizePublicAvailability } from "@/lib/directory/availability";
import { readPublicInquiryContext } from "@/lib/directory/inquiry-context";
import { getPublicUnits } from "@/lib/domain/data";

export const dynamic = "force-dynamic";

const siteUrl = process.env.SITE_URL ?? "https://shoppingaycelectronica.com";
const googleMapsUrl = "https://share.google/nKy73IM4ruoa1guRK";

type HomeProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: HomeProps) {
  const [units, params] = await Promise.all([getPublicUnits(), searchParams]);
  const availability = summarizePublicAvailability(units);
  const availabilityDescription = availability.hasData
    ? `Galería de ${availability.commercialUnitCount} salones comerciales en Planta Baja y Planta Alta del Mercado 4 de Asunción, con ${availability.availableUnitCount} espacios disponibles.`
    : "Galería comercial en el Mercado 4 de Asunción. Consultá la disponibilidad actual con la administración.";
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ShoppingCenter",
        name: "AYC Electrónica",
        description: availabilityDescription,
        slogan: "Un rincón de CDE en Asunción",
        url: siteUrl,
        image: `${siteUrl}/images/shopping-ayc-fachada.png`,
        telephone: "+595985864209",
        hasMap: googleMapsUrl,
        address: {
          "@type": "PostalAddress",
          streetAddress: "P92H+J7H, Mayor Fleitas esquina, Zona Mercado 4",
          postalCode: "001224",
          addressLocality: "Asunción",
          addressRegion: "Asunción",
          addressCountry: "PY",
        },
        areaServed: { "@type": "City", name: "Asunción" },
      },
      {
        "@type": "WebSite",
        name: "AYC Electrónica",
        inLanguage: "es-PY",
        description: "Encontrá tecnología, electrónica, servicio técnico y oportunidades de alquiler en el Mercado 4.",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <PublicMarketplace units={units} initialInquiry={readPublicInquiryContext(params)} />
    </>
  );
}
