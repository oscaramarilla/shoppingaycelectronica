import PublicMarketplace from "./PublicMarketplace";
import { getPublicUnits } from "@/lib/domain/data";

export const dynamic = "force-dynamic";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ShoppingCenter",
      name: "AYC Electrónica",
      description:
        "Galería de 50 salones comerciales en Planta Baja y Planta Alta del Mercado 4 de Asunción, con 21 espacios disponibles.",
      slogan: "Un rincón de CDE en Asunción",
      address: {
        "@type": "PostalAddress",
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
      description:
        "Encontrá tecnología, electrónica, servicio técnico y oportunidades de alquiler en el Mercado 4.",
    },
  ],
};

export default async function Home() {
  const units = await getPublicUnits();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <PublicMarketplace units={units} />
    </>
  );
}
