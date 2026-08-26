"use client";

import { FormEvent, useMemo, useState } from "react";
import type { PublicUnit, UnitStatus } from "@/lib/domain/types";
import { demoProfiles } from "@/lib/marketplace/demo";

const editorialCategories = ["Celulares", "Informática", "Electrónica", "Servicio técnico"];

const unitStatusLabels: Record<UnitStatus, string> = {
  occupied: "Local activo",
  available: "Disponible",
  reserved: "Reservado",
  maintenance: "En preparación",
};

const offers = [
  { code: "01", category: "Celulares", title: "Celulares y accesorios", copy: "Equipos, fundas, cargadores y soluciones para tu día a día.", tag: "Tecnología móvil" },
  { code: "02", category: "Informática", title: "Notebooks y computación", copy: "Equipos, componentes y periféricos para trabajo, estudio y gaming.", tag: "Computación" },
  { code: "03", category: "Electrónica", title: "Audio y entretenimiento", copy: "Parlantes, auriculares, consolas y accesorios para disfrutar más.", tag: "Audio & gaming" },
  { code: "04", category: "Electrónica", title: "Seguridad y conectividad", copy: "Cámaras, redes, routers y soluciones para hogares y negocios.", tag: "Conectividad" },
  { code: "05", category: "Servicio técnico", title: "Reparación especializada", copy: "Diagnóstico y reparación de celulares, notebooks y equipos electrónicos.", tag: "Servicio técnico" },
  { code: "06", category: "Informática", title: "Insumos y oficina", copy: "Impresión, almacenamiento, cables y todo para mantenerte conectado.", tag: "Accesorios" },
];

const faqs = [
  ["¿Qué puedo encontrar en AYC Electrónica?", "Tecnología, electrónica, accesorios, informática y servicios técnicos ofrecidos por los comercios de nuestra galería."],
  ["¿Dónde está ubicada la galería?", "Estamos en el Mercado 4, en el corazón comercial de Asunción. Publicaremos la ubicación exacta y las indicaciones definitivas antes del lanzamiento público."],
  ["¿Cómo consulto por un local disponible?", "Completá el formulario indicando que querés alquilar. El equipo de AYC te contactará para confirmar disponibilidad, condiciones y realizar una visita."],
  ["¿Puedo publicar productos si ya alquilo en AYC?", "Sí. La siguiente fase permitirá a cada locatario administrar su perfil, productos, servicios y promociones desde su propio acceso."],
];

export default function PublicMarketplace({ units }: { units: PublicUnit[] }) {
  const [category, setCategory] = useState("Todo");
  const [query, setQuery] = useState("");
  const [formState, setFormState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const categories = useMemo(() => [
    "Todo",
    ...new Set([
      ...editorialCategories,
      ...units.flatMap((unit) => unit.category ? [unit.category] : []),
    ]),
  ], [units]);

  const filteredOffers = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    return offers.filter((offer) => {
      const categoryMatch = category === "Todo" || offer.category === category;
      const queryMatch = !normalized || `${offer.title} ${offer.copy} ${offer.tag}`.toLocaleLowerCase("es").includes(normalized);
      return categoryMatch && queryMatch;
    });
  }, [category, query]);

  const filteredUnits = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    return units.filter((unit) => {
      const categoryMatch = category === "Todo" || unit.category === category;
      const searchable = `${unit.code} ${unit.floor} ${unit.tenant_name ?? ""} ${unit.category ?? ""}`.toLocaleLowerCase("es");
      return categoryMatch && (!normalized || searchable.includes(normalized));
    });
  }, [category, query, units]);

  const filteredProfiles = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    return demoProfiles.filter((profile) => {
      const categoryMatch = category === "Todo" || profile.category === category;
      const searchable = `${profile.name} ${profile.category} ${profile.summary} ${profile.specialties.join(" ")}`.toLocaleLowerCase("es");
      return categoryMatch && (!normalized || searchable.includes(normalized));
    });
  }, [category, query]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    document.querySelector("#directorio")?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setFormState("sending");
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      if (!response.ok) throw new Error("request failed");
      formElement.reset();
      setFormState("sent");
    } catch {
      setFormState("error");
    }
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="AYC Electrónica, inicio">
          <span className="brand-mark">AYC</span>
          <span className="brand-copy"><strong>Electrónica</strong><small>Shopping &amp; tecnología</small></span>
        </a>
        <nav className="desktop-nav" aria-label="Navegación principal">
          <a href="#directorio">Locales</a><a href="#productos">Productos</a><a href="#servicios">Servicios</a><a href="#visitanos">Cómo llegar</a>
        </nav>
        <a className="header-cta" href="#alquilar">Quiero alquilar <span aria-hidden="true">↗</span></a>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-noise" aria-hidden="true" />
        <div className="hero-content">
          <p className="eyebrow"><span /> Mercado 4 · Asunción</p>
          <h1>Un rincón de <em>CDE</em><br />en el corazón de Asunción.</h1>
          <p className="hero-lede">Tecnología, electrónica y servicios en un solo lugar. Descubrí una galería de 75 locales distribuidos en tres niveles del Mercado 4.</p>
          <form className="search-box" onSubmit={handleSearch}>
            <label className="sr-only" htmlFor="search">¿Qué estás buscando?</label>
            <span aria-hidden="true">⌕</span>
            <input id="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="¿Qué estás buscando?" />
            <button type="submit">Buscar</button>
          </form>
          <div className="category-row" aria-label="Categorías populares">
            {categories.slice(1, 5).map((item) => <button type="button" key={item} onClick={() => { setCategory(item); document.querySelector("#directorio")?.scrollIntoView({ behavior: "smooth" }); }}><span aria-hidden="true">+</span>{item}</button>)}
          </div>
        </div>
        <aside className="building-card" aria-label="Distribución de AYC Electrónica">
          <div className="card-topline"><span>AYC / M4</span><span>ASUNCIÓN · PY</span></div>
          <div className="building-visual">
            <div className="floor floor-two"><span>02</span><strong>Segundo piso</strong><small>Servicios especializados</small></div>
            <div className="floor floor-one"><span>01</span><strong>Primer piso</strong><small>Tecnología y accesorios</small></div>
            <div className="floor floor-ground"><span>PB</span><strong>Planta baja</strong><small>Comercios y atención</small></div>
          </div>
          <div className="availability"><span className="status-dot" /><div><strong>Consultá disponibilidad</strong><small>Espacios para hacer crecer tu negocio</small></div><a href="#alquilar" aria-label="Consultar locales disponibles">→</a></div>
        </aside>
      </section>

      <section className="proof-strip" aria-label="Datos de la galería">
        <div><strong>75</strong><span>locales comerciales</span></div><div><strong>3</strong><span>niveles conectados</span></div><div><strong>M4</strong><span>ubicación estratégica</span></div><p><span>Todo en un lugar</span><strong>Comprar · Reparar · Crecer</strong></p>
      </section>

      <section className="directory-section" id="directorio">
        <div className="section-heading"><div><p className="section-kicker">Directorio del shopping</p><h2>Encontrá un comercio<br />o un <em>local disponible.</em></h2></div><p>Información actualizada desde la gestión de AYC, sin publicar datos privados de contratos o locatarios.</p></div>
        <div className="filter-row" role="group" aria-label="Filtrar el directorio por categoría">{categories.map((item) => <button type="button" key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
        <div className="directory-summary"><strong>{filteredUnits.length}</strong><span>{filteredUnits.length === 1 ? "local coincide" : "locales coinciden"} con tu búsqueda</span></div>
        <div className="unit-grid">
          {filteredUnits.map((unit) => <article className="unit-card" key={unit.code}>
            <div><span className={`unit-status ${unit.status}`}>{unitStatusLabels[unit.status]}</span><strong>{unit.code}</strong></div>
            <h3>{unit.tenant_name ?? (unit.status === "available" ? "Espacio para tu negocio" : "AYC Electrónica")}</h3>
            <p>{unit.category ?? "Tecnología y servicios"}</p>
            <small>{unit.floor}</small>
            <a href={unit.status === "available" ? "#alquilar" : "#contacto"}>{unit.status === "available" ? "Consultar alquiler" : "Consultar comercio"}<span>→</span></a>
          </article>)}
          {units.length === 0 && <p className="empty-state">El directorio quedará visible cuando se carguen los locales en la base oficial.</p>}
          {units.length > 0 && filteredUnits.length === 0 && <p className="empty-state">No encontramos un local con esos filtros. Probá otra categoría o escribinos.</p>}
        </div>
      </section>

      <section className="profiles-section" id="comercios">
        <div className="demo-notice"><strong>Vista previa</strong><span>Estos tres perfiles son demostrativos y serán reemplazados por comercios reales autorizados.</span></div>
        <div className="section-heading"><div><p className="section-kicker">Así se verá el marketplace</p><h2>Cada comercio tendrá<br />su <em>propio local digital.</em></h2></div><p>Productos, servicios, precios orientativos, ubicación y un contacto público separado de los datos privados del alquiler.</p></div>
        <div className="profile-preview-grid">
          {filteredProfiles.map((profile, index) => <article className="profile-preview-card" key={profile.slug}>
            <div className={`profile-preview-art profile-preview-art-${index + 1}`}><span>DEMO</span><strong>{profile.unitCode}</strong><small>{profile.floor}</small></div>
            <div className="profile-preview-body">
              <span className="offer-tag">{profile.category}</span>
              <h3>{profile.name}</h3>
              <p>{profile.summary}</p>
              <div>{profile.specialties.map((specialty) => <small key={specialty}>{specialty}</small>)}</div>
              <a href={`/locales/${profile.slug}`}>Ver perfil de muestra <span>→</span></a>
            </div>
          </article>)}
          {filteredProfiles.length === 0 && <p className="empty-state">No hay una ficha de demostración para esos filtros. Probá otra categoría.</p>}
        </div>
      </section>

      <section className="market-section" id="productos">
        <div className="section-heading"><div><p className="section-kicker">Explorá AYC</p><h2>Lo que estás buscando,<br /><em>más cerca.</em></h2></div><p>Conectamos a compradores de Asunción con comercios especializados en tecnología y electrónica.</p></div>
        <div className="filter-row" role="group" aria-label="Filtrar categorías">{categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
        <div className="offers-grid">
          {filteredOffers.map((offer) => <article className="offer-card" key={offer.code}>
            <div className={`offer-art offer-art-${offer.code}`}><span>{offer.code}</span><strong>AYC</strong></div>
            <div className="offer-body"><span className="offer-tag">{offer.tag}</span><h3>{offer.title}</h3><p>{offer.copy}</p><a href="#contacto">Consultar comercios <span>→</span></a></div>
          </article>)}
          {filteredOffers.length === 0 && <p className="empty-state">No encontramos esa categoría todavía. Escribinos y te ayudamos a encontrarla.</p>}
        </div>
      </section>

      <section className="rent-section" id="alquilar">
        <div className="rent-copy"><p className="section-kicker light">Formá parte de AYC</p><h2>Tu próximo local<br />puede estar <em>acá.</em></h2><p>Instalá tu negocio en una galería especializada, dentro de una de las zonas comerciales más conocidas de Asunción.</p><ul><li><span>01</span>Ubicación en el Mercado 4</li><li><span>02</span>Comunidad enfocada en tecnología</li><li><span>03</span>Promoción dentro del marketplace AYC</li></ul><a className="primary-cta" href="#contacto">Solicitar información <span>↗</span></a></div>
        <div className="rent-levels" aria-label="Niveles de la galería"><div><span>PB</span><strong>Planta baja</strong><small>Disponibilidad a confirmar</small></div><div><span>01</span><strong>Primer piso</strong><small>Disponibilidad a confirmar</small></div><div><span>02</span><strong>Segundo piso</strong><small>Disponibilidad a confirmar</small></div></div>
      </section>

      <section className="services-section" id="servicios">
        <div className="section-heading"><div><p className="section-kicker">Soluciones cercanas</p><h2>Comprá, resolvé<br />y seguí adelante.</h2></div><p>Un punto de encuentro para clientes, técnicos, comercios y emprendedores.</p></div>
        <div className="service-list"><article><span>DIAGNÓSTICO</span><h3>Servicio técnico</h3><p>Encontrá especialistas para celulares, computadoras y electrónica.</p></article><article><span>COMPARÁ</span><h3>Productos y accesorios</h3><p>Descubrí opciones de distintos comercios sin salir de la galería.</p></article><article><span>CRECÉ</span><h3>Espacios comerciales</h3><p>Consultá oportunidades para llevar tu negocio a una ubicación estratégica.</p></article></div>
      </section>

      <section className="location-section" id="visitanos">
        <div className="map-card"><span className="map-label">MERCADO 4</span><div className="map-grid" /><div className="map-pin"><strong>AYC</strong><small>Electrónica</small></div></div>
        <div className="location-copy"><p className="section-kicker">Vení a conocernos</p><h2>En el corazón<br />del Mercado 4.</h2><p>Estamos preparando la ficha con dirección exacta, horarios y acceso al mapa para el lanzamiento oficial.</p><dl><div><dt>Ciudad</dt><dd>Asunción, Paraguay</dd></div><div><dt>Zona</dt><dd>Mercado Municipal N.º 4</dd></div><div><dt>Galería</dt><dd>Planta baja, 1.º y 2.º piso</dd></div></dl><a className="outline-cta" href="#contacto">Pedir ubicación exacta <span>→</span></a></div>
      </section>

      <section className="faq-section"><div><p className="section-kicker">Preguntas frecuentes</p><h2>Respuestas rápidas.</h2></div><div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></section>

      <section className="contact-section" id="contacto">
        <div><p className="section-kicker light">Hablemos</p><h2>¿Buscás un producto<br />o querés alquilar?</h2><p>Dejanos tus datos. Esta consulta quedará registrada para que el equipo de AYC pueda responderte.</p></div>
        <form className="inquiry-form" onSubmit={handleInquiry}>
          <label>Quiero consultar por<select name="kind" defaultValue="alquiler"><option value="alquiler">Alquiler de un local</option><option value="producto">Un producto o servicio</option><option value="comerciante">Publicar como comerciante</option></select></label>
          <div className="field-pair"><label>Nombre y apellido<input name="name" required autoComplete="name" /></label><label>Teléfono / WhatsApp<input name="phone" required inputMode="tel" autoComplete="tel" /></label></div>
          <label>¿Cómo podemos ayudarte?<textarea name="message" rows={4} required /></label>
          <button type="submit" disabled={formState === "sending"}>{formState === "sending" ? "Enviando…" : "Enviar consulta"}<span>→</span></button>
          <p className={`form-message ${formState}`}>{formState === "sent" ? "¡Gracias! Tu consulta fue registrada correctamente." : formState === "error" ? "No pudimos registrar la consulta. Probá nuevamente." : "Tus datos se usarán únicamente para responder esta consulta."}</p>
        </form>
      </section>

      <footer><a className="brand footer-brand" href="#inicio"><span className="brand-mark">AYC</span><span className="brand-copy"><strong>Electrónica</strong><small>Shopping &amp; tecnología</small></span></a><p>Un rincón de CDE en Asunción.</p><div><a href="#productos">Marketplace</a><a href="#alquilar">Alquilar</a><a href="/gestion">Gestión</a></div><small>© 2026 AYC Electrónica · Asunción, Paraguay</small></footer>
    </main>
  );
}
