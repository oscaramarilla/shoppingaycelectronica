import Image from "next/image";
import { GROUP_COMPANIES } from "@/lib/directory/group-companies";

export default function GroupCompanies() {
  return (
    <section className="group-section" id="grupo-ayc">
      <div className="group-banner">
        <div className="group-noise" aria-hidden="true" />
        <div className="group-banner-copy">
          <p className="section-kicker light">Grupo AYC · 2do piso</p>
          <h2>Respaldado por el<br /><em>Grupo AYC.</em></h2>
        </div>
        <p className="group-banner-lede">
          El 2do piso no se alquila: ahí trabajan la administración y las cuatro
          empresas propias del grupo. Son la industria y la tecnología que
          sostienen al shopping.
        </p>
      </div>

      <ul className="group-grid">
        {GROUP_COMPANIES.map((company) => (
          <li key={company.slug}>
            <a className="group-card" href={company.href} target="_blank" rel="noreferrer">
              <span className="group-logo">
                {company.logo ? (
                  <Image
                    src={company.logo}
                    alt={`Logo de ${company.name}`}
                    fill
                    sizes="220px"
                  />
                ) : (
                  <span className="group-wordmark">{company.name}</span>
                )}
              </span>
              <span className="group-tagline">{company.tagline}</span>
              <strong>{company.name}</strong>
              <p>{company.description}</p>
              <span className="group-cta">
                Conocer más <span aria-hidden="true">↗</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
