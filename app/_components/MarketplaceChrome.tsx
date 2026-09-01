import Link from "next/link";
import styles from "../marketplace-pages.module.css";

export function MarketplaceHeader({
  backHref = "/",
  backLabel = "Volver al shopping",
}: {
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <header className={styles.topbar}>
      <Link className="brand" href="/" aria-label="Shopping AYC Electrónica, inicio">
        <span className="brand-mark">AYC</span>
        <span className="brand-copy">
          <strong>Electrónica</strong>
          <small>Shopping &amp; tecnología</small>
        </span>
      </Link>
      <nav className={styles.topnav} aria-label="Navegación del marketplace">
        <Link href="/#directorio">Directorio</Link>
        <Link href="/#disponibles">Alquilar</Link>
        <Link href={backHref}>← {backLabel}</Link>
      </nav>
    </header>
  );
}

export function MarketplaceFooter() {
  return (
    <footer className={styles.footer}>
      <Link className="brand" href="/">
        <span className="brand-mark">AYC</span>
        <span className="brand-copy">
          <strong>Electrónica</strong>
          <small>Shopping &amp; tecnología</small>
        </span>
      </Link>
      <p>
        Un rincón de CDE en Asunción.
        <br />
        Mercado 4 · Paraguay
      </p>
      <div>
        <a href="tel:+595985864209">0985 864209</a>
        <a href="https://share.google/nKy73IM4ruoa1guRK" target="_blank" rel="noreferrer">
          Cómo llegar ↗
        </a>
      </div>
    </footer>
  );
}

export function MarketplaceBreadcrumbs({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav className={styles.breadcrumbs} aria-label="Migas de pan">
      <ol>
        {items.map((item) => (
          <li key={`${item.href ?? "current"}-${item.label}`}>
            {item.href ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function MockDataNotice() {
  return (
    <div className={styles.mockNotice} role="note">
      <strong>Vista previa</strong>
      <span>Comercio, salón, horario, ofertas y precios son datos demostrativos. Esta página no se indexará hasta usar información autorizada.</span>
    </div>
  );
}
