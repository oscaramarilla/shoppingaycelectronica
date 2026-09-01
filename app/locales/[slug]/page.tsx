import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/app/_components/JsonLd";
import {
  MarketplaceBreadcrumbs,
  MarketplaceFooter,
  MarketplaceHeader,
  MockDataNotice,
} from "@/app/_components/MarketplaceChrome";
import {
  BusinessProfileCard,
  CatalogItemCard,
} from "@/app/_components/MarketplaceCards";
import {
  getPublicBusinessProfile,
  listPublicBusinessProfiles,
} from "@/lib/marketplace/data";
import {
  buildMarketplaceInquiryHref,
  buildWhatsappHref,
} from "@/lib/marketplace/format";
import { buildBusinessProfileJsonLd } from "@/lib/marketplace/seo";
import styles from "../../marketplace-pages.module.css";

type ProfilePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return (await listPublicBusinessProfiles()).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const detail = await getPublicBusinessProfile((await params).slug);
  if (!detail) return { title: "Comercio no encontrado" };

  const { profile, category } = detail;
  const title = `${profile.publicName} · ${category.shortName} en Mercado 4`;
  const description = profile.isDemo
    ? `Vista demostrativa: ${profile.summary}`
    : profile.summary;

  return {
    title,
    description,
    alternates: { canonical: `/locales/${profile.slug}` },
    robots: profile.isDemo
      ? { index: false, follow: false, noarchive: true }
      : { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: "es_PY",
      title,
      description,
      url: `/locales/${profile.slug}`,
      images: [
        {
          url: "/images/shopping-ayc-fachada.png",
          width: 680,
          height: 382,
          alt: `${profile.publicName} en Shopping AYC Electrónica`,
        },
      ],
    },
  };
}

export default async function BusinessProfilePage({ params }: ProfilePageProps) {
  const detail = await getPublicBusinessProfile((await params).slug);
  if (!detail) notFound();

  const { profile, category, catalogItems, relatedProfiles } = detail;
  const subject = profile.publicName;
  const contactHref = profile.publicWhatsapp
    ? buildWhatsappHref(profile.publicWhatsapp, subject)
    : buildMarketplaceInquiryHref(subject);

  return (
    <main className={styles.page}>
      <JsonLd data={buildBusinessProfileJsonLd(detail)} />
      <MarketplaceHeader
        backHref={`/categorias/${category.slug}`}
        backLabel={`Ver ${category.shortName.toLocaleLowerCase("es")}`}
      />
      <MarketplaceBreadcrumbs
        items={[
          { label: "Inicio", href: "/" },
          { label: category.name, href: `/categorias/${category.slug}` },
          { label: profile.publicName },
        ]}
      />

      <section className={styles.profileHero}>
        <div className={styles.profileHeroCopy}>
          {profile.isDemo && <MockDataNotice />}
          <Link className={styles.heroCategory} href={`/categorias/${category.slug}`}>
            {category.eyebrow} · {category.name}
          </Link>
          <h1>{profile.publicName}</h1>
          <p>{profile.summary}</p>
          <div className={styles.heroActions}>
            <a
              className={styles.primaryAction}
              href={contactHref}
              target={profile.publicWhatsapp ? "_blank" : undefined}
              rel={profile.publicWhatsapp ? "noreferrer" : undefined}
            >
              Consultar ahora <span aria-hidden="true">→</span>
            </a>
            <Link className={styles.secondaryAction} href="#catalogo">
              Ver productos y servicios
            </Link>
          </div>
        </div>

        <aside className={styles.profileFactCard} aria-label="Ubicación y horario del comercio">
          <span>Encontralo en la galería</span>
          <strong>{profile.unitCodes.join(" · ")}</strong>
          <p>{profile.locationHint}</p>
          <dl>
            <div><dt>Nivel</dt><dd>{profile.floorLabel}</dd></div>
            <div><dt>Horario</dt><dd>{profile.hoursLabel}</dd></div>
            <div><dt>Contacto</dt><dd>{profile.publicWhatsapp ? "WhatsApp comercial autorizado" : "A través de recepción AYC"}</dd></div>
          </dl>
        </aside>
      </section>

      <section className={styles.trustStrip} aria-label="Compromisos del marketplace">
        <div><strong>Información pública autorizada</strong><span>La ficha comercial se mantiene separada del contrato privado.</span></div>
        <div><strong>Contacto con contexto</strong><span>La consulta identifica el comercio y la solución que interesa.</span></div>
        <div><strong>Datos verificables</strong><span>Precios, horarios y disponibilidad tendrán fecha de confirmación.</span></div>
      </section>

      <section className={styles.contentSection} id="catalogo">
        <div className={styles.sectionHeading}>
          <div>
            <span>Catálogo del comercio</span>
            <h2>Productos y servicios para resolver tu búsqueda.</h2>
          </div>
          <p>
            Cada oferta explica qué incluye, si necesita cotización y cuál es el siguiente paso. En producción solo se publicará información aprobada por el comercio.
          </p>
        </div>
        {catalogItems.length > 0 ? (
          <div className={styles.catalogGrid}>
            {catalogItems.map((item, index) => (
              <CatalogItemCard key={item.id} item={item} profile={profile} index={index} />
            ))}
          </div>
        ) : (
          <p className={styles.emptyCatalog}>Este comercio todavía no publicó productos o servicios. Podés enviar una consulta general desde el botón superior.</p>
        )}
      </section>

      <section className={styles.aboutSection}>
        <div>
          <p className="section-kicker light">Sobre el comercio</p>
          <h2>Una ficha útil,<br /><span>no un anuncio vacío.</span></h2>
        </div>
        <div className={styles.aboutCopy}>
          <p>{profile.description}</p>
          <div className={styles.tagList} aria-label="Especialidades">
            {profile.specialties.map((specialty) => <span key={specialty}>{specialty}</span>)}
          </div>
        </div>
      </section>

      {relatedProfiles.length > 0 && (
        <section className={styles.relatedSection}>
          <div className={styles.sectionHeading}>
            <div>
              <span>También en {category.shortName}</span>
              <h2>Compará otras opciones dentro del shopping.</h2>
            </div>
            <p>Los enlaces internos ayudan al visitante a decidir y a los buscadores a comprender la oferta completa del Shopping AYC.</p>
          </div>
          <div className={styles.relatedGrid}>
            {relatedProfiles.map((relatedProfile) => (
              <BusinessProfileCard
                key={relatedProfile.id}
                profile={relatedProfile}
                category={category}
              />
            ))}
          </div>
        </section>
      )}

      <section className={styles.conversionBand}>
        <div>
          <h2>¿Querés confirmar antes de venir?</h2>
          <p>Enviá tu consulta con el producto, modelo o servicio que necesitás. El marketplace conservará el origen del contacto para derivarlo correctamente.</p>
        </div>
        <a className={styles.primaryAction} href={contactHref}>
          Iniciar consulta <span aria-hidden="true">→</span>
        </a>
      </section>

      <MarketplaceFooter />
    </main>
  );
}
