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
  getPublicCategoryDirectory,
  listPublicCategories,
} from "@/lib/marketplace/data";
import { buildMarketplaceInquiryHref } from "@/lib/marketplace/format";
import { buildCategoryJsonLd } from "@/lib/marketplace/seo";
import { setRequestLocale } from "next-intl/server";
import styles from "@/app/marketplace-pages.module.css";

type CategoryPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  return (await listPublicCategories()).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const directory = await getPublicCategoryDirectory((await params).slug);
  if (!directory) return { title: "Categoría no encontrada" };

  const { category, isDemo } = directory;
  const title = `${category.name} en Mercado 4`;

  return {
    title,
    description: category.description,
    alternates: { canonical: `/categorias/${category.slug}` },
    robots: isDemo
      ? { index: false, follow: false, noarchive: true }
      : { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: "es_PY",
      title,
      description: category.description,
      url: `/categorias/${category.slug}`,
      images: [
        {
          url: "/images/shopping-ayc-fachada.png",
          width: 680,
          height: 382,
          alt: `${category.name} en Shopping AYC Electrónica`,
        },
      ],
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const directory = await getPublicCategoryDirectory(slug);
  if (!directory) notFound();

  const { category, profiles, catalogItems, otherCategories, isDemo } = directory;
  const inquiryHref = buildMarketplaceInquiryHref(category.name);

  return (
    <main className={styles.page}>
      <JsonLd data={buildCategoryJsonLd(directory)} />
      <MarketplaceHeader />
      <MarketplaceBreadcrumbs
        items={[
          { label: "Inicio", href: "/" },
          { label: "Categorías", href: "/#directorio" },
          { label: category.name },
        ]}
      />

      <section className={styles.categoryHero}>
        <div className={styles.categoryHeroCopy}>
          {isDemo && <MockDataNotice />}
          <span className={styles.heroCategory}>{category.eyebrow}</span>
          <h1>{category.name}<br />en Mercado 4.</h1>
          <p>{category.description}</p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryAction} href="#comercios">
              Comparar comercios <span aria-hidden="true">↓</span>
            </Link>
            <a className={styles.secondaryAction} href={inquiryHref}>Pedir orientación</a>
          </div>
        </div>
        <aside className={styles.categoryStats} aria-label="Resumen de la categoría">
          <div><strong>{profiles.length}</strong><span>{profiles.length === 1 ? "comercio" : "comercios"}</span></div>
          <div><strong>{catalogItems.length}</strong><span>{catalogItems.length === 1 ? "oferta" : "ofertas"}</span></div>
          <p>{category.searchIntent}</p>
        </aside>
      </section>

      <section className={styles.categoryDirectory} id="comercios">
        <div className={styles.sectionHeading}>
          <div>
            <span>Directorio por intención</span>
            <h2>Elegí a quién consultar dentro del shopping.</h2>
          </div>
          <p>Cada ficha reúne ubicación, especialidades, catálogo y un contacto autorizado. La marca pública nunca se obtiene del nombre legal del contrato.</p>
        </div>
        {profiles.length > 0 ? (
          <div className={styles.businessGrid}>
            {profiles.map((profile) => (
              <BusinessProfileCard
                key={profile.id}
                profile={profile}
                category={category}
                itemCount={catalogItems.filter(({ businessProfileId }) => businessProfileId === profile.id).length}
              />
            ))}
          </div>
        ) : (
          <p className={styles.emptyCatalog}>Todavía no hay comercios autorizados en esta categoría.</p>
        )}
      </section>

      {catalogItems.length > 0 && (
        <section className={styles.contentSection}>
          <div className={styles.sectionHeading}>
            <div>
              <span>Ofertas destacadas</span>
              <h2>Empezá por una necesidad concreta.</h2>
            </div>
            <p>Los productos con precio confirmado podrán usar Product/Offer. Los servicios o soluciones variables pedirán una cotización, sin inventar valores.</p>
          </div>
          <div className={styles.catalogGrid}>
            {catalogItems.slice(0, 4).map((item, index) => {
              const profile = profiles.find(({ id }) => id === item.businessProfileId);
              if (!profile) return null;
              return <CatalogItemCard key={item.id} item={item} profile={profile} index={index} />;
            })}
          </div>
        </section>
      )}

      <section className={styles.buyerGuide}>
        <div>
          <p className="section-kicker">Antes de decidir</p>
          <h2>Tres preguntas que mejoran tu compra.</h2>
        </div>
        <div className={styles.questionList}>
          {category.buyerQuestions.map((question, index) => (
            <article key={question}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{question}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.categoryLinks}>
        <div className={styles.sectionHeading}>
          <div>
            <span>Explorá el shopping</span>
            <h2>Otras categorías.</h2>
          </div>
          <p>Una arquitectura por temas conecta búsquedas relacionadas y evita mezclar productos que resuelven necesidades distintas.</p>
        </div>
        <div className={styles.categoryLinkGrid}>
          {otherCategories.map((otherCategory) => (
            <Link key={otherCategory.slug} href={`/categorias/${otherCategory.slug}`}>
              {otherCategory.name} <span aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.conversionBand}>
        <div>
          <h2>¿No sabés cuál elegir?</h2>
          <p>Contanos qué necesitás, el modelo, la cantidad y la urgencia. El equipo del Shopping AYC podrá derivar la consulta al comercio adecuado.</p>
        </div>
        <a className={styles.primaryAction} href={inquiryHref}>
          Pedir orientación <span aria-hidden="true">→</span>
        </a>
      </section>

      <MarketplaceFooter />
    </main>
  );
}
