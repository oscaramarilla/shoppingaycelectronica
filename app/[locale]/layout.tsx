import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import "../globals.css";

function getMetadataBase() {
  try {
    return new URL(process.env.SITE_URL ?? "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return {
    metadataBase: getMetadataBase(),
    title: {
      default: t('titleDefault'),
      template: t('titleTemplate'),
    },
    description: t('description'),
    keywords: ["electrónica Asunción", "tecnología Mercado 4", "servicio técnico Asunción", "alquiler de locales Mercado 4", "AYC Electrónica", "tecnologia paraguay", "celulares asuncion", "electronica mercado 4"],
    openGraph: {
      type: "website",
      locale: locale === 'es' ? "es_PY" : locale === 'en' ? "en_US" : "pt_BR",
      title: t('ogTitle'),
      description: t('description'),
      images: [{ url: "/og.png", width: 1730, height: 909, alt: t('ogTitle') }],
    },
    twitter: {
      card: "summary_large_image",
      title: t('ogTitle'),
      description: t('description'),
      images: ["/og.png"],
    },
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
  };
}

export default async function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
