import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { demoProfiles, getDemoProfile } from "@/lib/marketplace/demo";

type ProfilePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return demoProfiles.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const profile = getDemoProfile((await params).slug);

  if (!profile) return { title: "Comercio no encontrado" };

  return {
    title: `${profile.name} | Vista de demostración`,
    description: profile.summary,
    robots: { index: false, follow: false, noarchive: true },
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const profile = getDemoProfile((await params).slug);
  if (!profile) notFound();

  return (
    <main className="profile-page">
      <header className="profile-topbar">
        <a className="brand" href="/" aria-label="Volver a Shopping AYC Electrónica">
          <span className="brand-mark">AYC</span>
          <span className="brand-copy">
            <strong>Electrónica</strong>
            <small>Shopping &amp; tecnología</small>
          </span>
        </a>
        <a className="profile-back" href="/#comercios">← Volver al marketplace</a>
      </header>

      <section className="profile-hero">
        <div>
          <p className="demo-label">Vista de demostración · no es un comercio real</p>
          <span className="profile-category">{profile.category}</span>
          <h1>{profile.name}</h1>
          <p>{profile.summary}</p>
          <div className="profile-tags">
            {profile.specialties.map((specialty) => <span key={specialty}>{specialty}</span>)}
          </div>
        </div>
        <aside className="profile-location-card">
          <span>{profile.unitCode}</span>
          <strong>{profile.floor}</strong>
          <p>{profile.locationHint}</p>
          <small>{profile.hours}</small>
        </aside>
      </section>

      <section className="profile-offers-section">
        <div className="profile-section-heading">
          <div>
            <p className="section-kicker">Catálogo de ejemplo</p>
            <h2>Productos y servicios</h2>
          </div>
          <p>Los nombres, ubicaciones y precios de esta ficha son ilustrativos. Mañana serán reemplazados por datos autorizados de los locatarios.</p>
        </div>
        <div className="profile-offers-grid">
          {profile.offers.map((offer, index) => (
            <article key={offer.name}>
              <span>{String(index + 1).padStart(2, "0")} · {offer.kind === "product" ? "Producto" : "Servicio"}</span>
              <h3>{offer.name}</h3>
              <p>{offer.description}</p>
              <strong>{offer.priceLabel}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="profile-contact">
        <div>
          <p className="section-kicker light">Conversión de ejemplo</p>
          <h2>¿Te interesa esta solución?</h2>
          <p>En una ficha real este botón abrirá el WhatsApp público autorizado del comercio y registrará el origen del lead.</p>
        </div>
        <a href="/#contacto">Probar consulta <span>→</span></a>
      </section>
    </main>
  );
}
