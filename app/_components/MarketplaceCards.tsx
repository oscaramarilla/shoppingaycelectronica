import Link from "next/link";
import {
  buildMarketplaceInquiryHref,
  buildWhatsappHref,
  formatAvailability,
  formatCatalogPrice,
} from "@/lib/marketplace/format";
import type {
  BusinessProfile,
  CatalogItem,
  MarketplaceCategory,
} from "@/lib/marketplace/types";
import styles from "../marketplace-pages.module.css";

export function CatalogItemCard({
  item,
  profile,
  index,
}: {
  item: CatalogItem;
  profile: BusinessProfile;
  index: number;
}) {
  const subject = `${item.name} de ${profile.publicName}`;
  const contactHref = profile.publicWhatsapp
    ? buildWhatsappHref(profile.publicWhatsapp, subject)
    : buildMarketplaceInquiryHref(subject);

  return (
    <article className={styles.catalogCard} id={item.slug}>
      <div className={styles.catalogArt} aria-hidden="true">
        <span>{String(index + 1).padStart(2, "0")}</span>
        <strong>{item.kind === "product" ? "PRO" : "SER"}</strong>
      </div>
      <div className={styles.catalogBody}>
        <div className={styles.catalogMeta}>
          <span>{item.kind === "product" ? "Producto" : "Servicio"}</span>
          <span>{formatAvailability(item.availability)}</span>
        </div>
        <h3>{item.name}</h3>
        <p>{item.summary}</p>
        <ul>
          {item.attributes.map((attribute) => <li key={attribute}>{attribute}</li>)}
        </ul>
        <div className={styles.catalogConversion}>
          <div>
            <small>{item.isDemo ? "Valor ilustrativo" : "Precio publicado"}</small>
            <strong>{formatCatalogPrice(item)}</strong>
          </div>
          <a href={contactHref} target={profile.publicWhatsapp ? "_blank" : undefined} rel={profile.publicWhatsapp ? "noreferrer" : undefined}>
            Consultar <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </article>
  );
}

export function BusinessProfileCard({
  profile,
  category,
  itemCount,
}: {
  profile: BusinessProfile;
  category: MarketplaceCategory;
  itemCount?: number;
}) {
  return (
    <article className={styles.businessCard}>
      <div className={styles.businessCardArt}>
        <span>{category.shortName}</span>
        <strong>{profile.unitCodes.join(" · ")}</strong>
        <small>{profile.floorLabel}</small>
      </div>
      <div className={styles.businessCardBody}>
        {profile.isDemo && <span className={styles.inlineDemo}>Demostración</span>}
        <h2>{profile.publicName}</h2>
        <p>{profile.summary}</p>
        <div className={styles.tagList}>
          {profile.specialties.map((specialty) => <span key={specialty}>{specialty}</span>)}
        </div>
        <div className={styles.businessCardFooter}>
          <small>
            {typeof itemCount === "number"
              ? `${itemCount} ${itemCount === 1 ? "oferta publicada" : "ofertas publicadas"}`
              : "Explorar el comercio"}
          </small>
          <Link href={`/locales/${profile.slug}`}>Ver ficha <span aria-hidden="true">→</span></Link>
        </div>
      </div>
    </article>
  );
}
