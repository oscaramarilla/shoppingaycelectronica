import type { Metadata } from "next";
import "./globals.css";

function getMetadataBase() {
  try {
    return new URL(process.env.SITE_URL ?? "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: "AYC Electrónica | Tecnología en el Mercado 4",
    template: "%s | AYC Electrónica",
  },
  description: "Tecnología, electrónica, servicio técnico y locales comerciales en el Mercado 4 de Asunción. Un rincón de CDE en Asunción.",
  keywords: ["electrónica Asunción", "tecnología Mercado 4", "servicio técnico Asunción", "alquiler de locales Mercado 4", "AYC Electrónica"],
  openGraph: {
    type: "website",
    locale: "es_PY",
    title: "AYC Electrónica | Un rincón de CDE en Asunción",
    description: "Tecnología, electrónica, servicios y oportunidades comerciales en el Mercado 4.",
    images: [{ url: "/og.png", width: 1730, height: 909, alt: "AYC Electrónica — Un rincón de CDE en Asunción" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AYC Electrónica | Un rincón de CDE en Asunción",
    description: "Tecnología, electrónica, servicios y oportunidades comerciales en el Mercado 4.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-PY">
      <body>{children}</body>
    </html>
  );
}
