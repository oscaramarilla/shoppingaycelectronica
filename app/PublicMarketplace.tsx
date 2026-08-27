"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import {
  AVAILABLE_UNIT_COUNT,
  AVAILABLE_UNITS_BY_FLOOR,
  COMMERCIAL_UNIT_COUNT,
} from "@/lib/directory/availability";
import type { PublicUnit, UnitStatus } from "@/lib/domain/types";

const GOOGLE_MAPS_URL = "https://share.google/nKy73IM4ruoa1guRK";
const PRIMARY_PHONE = "0985 864209";
const PRIMARY_PHONE_HREF = "tel:+595985864209";
const PRIMARY_ADDRESS = "P92H+J7H, Mayor Fleitas esquina, Zona Mercado 4, Asunción 001224";

const unitStatusLabels: Record<UnitStatus, string> = {
  occupied: "Ocupado",
  available: "Disponible",
  reserved: "Reservado",
  maintenance: "En preparación",
};

const faqs = [
  ["¿Cuántos salones comerciales tiene la galería?", "Son 50 salones: 26 en Planta Baja y 24 en Planta Alta. El 2do piso corresponde a administración y AYC Empresas; no se ofrece como salón comercial."],
  ["¿Cuántos salones están disponibles?", "Hay 21 vacancias verificadas: 4 en Planta Baja y 17 en Planta Alta."],
  ["¿Por qué la Planta Alta es una oportunidad?", "Tiene 17 de sus 24 salones disponibles, aproximadamente el 70%. Es el nivel con mayor capacidad para recibir nuevos comercios y propuestas complementarias."],
  ["¿Dónde queda y cuál es el teléfono principal?", `Estamos en ${PRIMARY_ADDRESS}. El teléfono principal es ${PRIMARY_PHONE}.`],
  ["¿Cómo consulto por un salón?", "Elegí una vacancia y completá el formulario. El equipo de AYC confirmará condiciones, expensa, disponibilidad y una visita."],
  ["¿Cuándo aparecerán los nombres y productos de los comercios?", "Se publicarán únicamente después del relevamiento y la autorización de cada inquilino. Los nombres legales y datos de alquiler nunca serán públicos."],
];

export default function PublicMarketplace({ units }: { units: PublicUnit[] }) {
  const [category, setCategory] = useState("Todo");
  const [query, setQuery] = useState("");
  const [formState, setFormState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const categories = useMemo(() => [
    "Todo",
    ...new Set(units.flatMap((unit) => unit.category ? [unit.category] : [])),
  ], [units]);

  const filteredUnits = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    return units.filter((unit) => {
      const categoryMatch = category === "Todo" || unit.category === category;
      const searchable = `${unit.code} ${unit.floor} ${unit.category ?? ""}`.toLocaleLowerCase("es");
      return categoryMatch && (!normalized || searchable.includes(normalized));
    });
  }, [category, query, units]);

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
          <a href="#disponibles">Salones disponibles</a><a href="#directorio">Directorio</a><a href="#visitanos">Cómo llegar</a>
        </nav>
        <a className="header-cta" href={PRIMARY_PHONE_HREF} aria-label={`Llamar al ${PRIMARY_PHONE}`}><span>{PRIMARY_PHONE}</span><span aria-hidden="true">↗</span></a>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-noise" aria-hidden="true" />
        <div className="hero-content">
          <p className="eyebrow"><span /> Mercado 4 · Asunción</p>
          <h1>Un rincón de <em>CDE</em><br />en el corazón de Asunción.</h1>
          <p className="hero-lede">Una galería de 50 salones comerciales en Planta Baja y Planta Alta, con administración y AYC Empresas en el 2do piso.</p>
          <form className="search-box" onSubmit={handleSearch}>
            <label className="sr-only" htmlFor="search">Buscar por salón o categoría</label>
            <span aria-hidden="true">⌕</span>
            <input id="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscá por salón o categoría" />
            <button type="submit">Buscar</button>
          </form>
          <div className="category-row" aria-label="Datos destacados">
            <a href="#disponibles"><span aria-hidden="true">+</span>{AVAILABLE_UNIT_COUNT} vacancias verificadas</a>
            <a href="#disponibles"><span aria-hidden="true">+</span>Planta Alta · ~70% disponible</a>
          </div>
        </div>
        <aside className="building-card" aria-label="Distribución real de Shopping AYC Electrónica">
          <div className="card-topline"><span>AYC / M4</span><span>ASUNCIÓN · PY</span></div>
          <div className="building-visual">
            <div className="floor floor-two"><span>02</span><strong>2do piso</strong><small>Administración · AYC Empresas</small></div>
            <div className="floor floor-one"><span>PA</span><strong>Planta Alta</strong><small>24 salones · 17 disponibles</small></div>
            <div className="floor floor-ground"><span>PB</span><strong>Planta Baja</strong><small>26 salones · 4 disponibles</small></div>
          </div>
          <div className="availability"><span className="status-dot" /><div><strong>21 salones disponibles</strong><small>Vacancias verificadas el 27/08/2026</small></div><a href="#disponibles" aria-label="Ver salones disponibles">→</a></div>
        </aside>
      </section>

      <section className="proof-strip" aria-label="Datos verificados de la galería">
        <div><strong>{COMMERCIAL_UNIT_COUNT}</strong><span>salones comerciales</span></div><div><strong>{AVAILABLE_UNIT_COUNT}</strong><span>disponibles hoy</span></div><div><strong>3</strong><span>niveles reales</span></div><p><span>Distribución</span><strong>PB + PA comercial · 2do administración</strong></p>
      </section>

      <section className="rent-section availability-focus" id="disponibles">
        <div className="rent-copy">
          <p className="section-kicker light">Salones disponibles / Quiero alquilar</p>
          <h2><strong>21 vacancias.</strong><br />La Planta Alta es<br /><em>la oportunidad.</em></h2>
          <p>Con 17 de 24 salones disponibles, la Planta Alta concentra aproximadamente el 70% de la capacidad libre. Es el momento para sumar comercios, servicios y propuestas que atraigan más público a todo el shopping.</p>
          <ul><li><span>01</span>Ubicación en el corazón del Mercado 4</li><li><span>02</span>Ficha pública y promoción dentro del marketplace AYC</li><li><span>03</span>Contacto directo con la administración para visitar</li></ul>
          <a className="primary-cta" href="#contacto">Quiero conocer un salón <span>↗</span></a>
        </div>
        <div className="vacancy-board" aria-label="Listado de salones disponibles">
          {AVAILABLE_UNITS_BY_FLOOR.slice().reverse().map((group) => (
            <article className={group.shortLabel === "PA" ? "featured" : ""} key={group.shortLabel}>
              <header><div><span>{group.shortLabel}</span><strong>{group.floor}</strong></div><p><b>{group.available}</b> de {group.total}<small>disponibles</small></p></header>
              <p>{group.opportunity}</p>
              <div className="vacancy-codes">{group.codes.map((code) => <a href="#contacto" key={code} aria-label={`Consultar alquiler del salón ${code}`}>{code}</a>)}</div>
            </article>
          ))}
          <small className="vacancy-note">Disponibilidad relevada el 27/08/2026. La administración confirma condiciones y vigencia antes de reservar.</small>
        </div>
      </section>

      <section className="directory-section" id="directorio">
        <div className="section-heading"><div><p className="section-kicker">Directorio seguro</p><h2>Encontrá un salón<br />sin exponer <em>datos privados.</em></h2></div><p>El directorio muestra únicamente código, piso, estado y categoría autorizada. Los nombres legales, alquileres y teléfonos contractuales quedan en el panel privado.</p></div>
        {categories.length > 1 && <div className="filter-row" role="group" aria-label="Filtrar el directorio por categoría">{categories.map((item) => <button type="button" key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>}
        <div className="directory-summary"><strong>{filteredUnits.length}</strong><span>{filteredUnits.length === 1 ? "salón coincide" : "salones coinciden"} con tu búsqueda</span></div>
        <div className="unit-grid">
          {filteredUnits.map((unit) => <article className="unit-card" key={unit.code}>
            <div><span className={`unit-status ${unit.status}`}>{unitStatusLabels[unit.status]}</span><strong>{unit.code}</strong></div>
            <h3>{unit.status === "available" ? "Salón disponible" : "Salón ocupado"}</h3>
            <p>{unit.category ?? (unit.status === "available" ? "Consultá condiciones de alquiler" : "Perfil comercial pendiente de autorización")}</p>
            <small>{unit.floor}</small>
            <a href={unit.status === "available" ? "#contacto" : "#directorio"}>{unit.status === "available" ? "Consultar alquiler" : "Ficha comercial próximamente"}<span>→</span></a>
          </article>)}
          {units.length === 0 && <p className="empty-state">El directorio completo aparecerá al conectar la base oficial. Las 21 vacancias verificadas ya están publicadas en la sección anterior.</p>}
          {units.length > 0 && filteredUnits.length === 0 && <p className="empty-state">No encontramos un salón con esos filtros. Probá con el código, el piso o escribinos.</p>}
        </div>
      </section>

      <section className="services-section" id="servicios">
        <div className="section-heading"><div><p className="section-kicker">Próxima capa comercial</p><h2>Datos reales,<br />publicados con permiso.</h2></div><p>El relevamiento de comercios comienza mañana. No mostraremos marcas, productos, precios, fotos ni WhatsApps hasta tener autorización.</p></div>
        <div className="service-list"><article><span>01 · RELEVAMIENTO</span><h3>Ficha del comercio</h3><p>Marca, categoría, ubicación y horario confirmados por cada inquilino.</p></article><article><span>02 · AUTORIZACIÓN</span><h3>Productos y servicios</h3><p>Ofertas, precios y fotografías revisados antes de cualquier publicación.</p></article><article><span>03 · CONVERSIÓN</span><h3>Contacto público</h3><p>WhatsApp comercial autorizado, separado del teléfono privado del contrato.</p></article></div>
      </section>

      <section className="location-section" id="visitanos">
        <figure className="location-photo">
          <Image src="/images/shopping-ayc-fachada.png" alt="Fachada azul de Shopping AYC Electrónica en el Mercado 4 de Asunción" fill sizes="(max-width: 900px) 100vw, 55vw" />
          <figcaption><span>Ubicación oficial</span><strong>Shopping AYC Electrónica</strong></figcaption>
        </figure>
        <div className="location-copy"><p className="section-kicker">Vení a conocernos</p><h2>En el corazón<br />del Mercado 4.</h2><p>La galería tiene Planta Baja y Planta Alta comerciales. El 2do piso concentra la administración y los cuatro negocios familiares de AYC.</p><dl><div><dt>Dirección</dt><dd>{PRIMARY_ADDRESS}</dd></div><div><dt>Teléfono</dt><dd><a href={PRIMARY_PHONE_HREF}>{PRIMARY_PHONE}</a></dd></div><div><dt>Galería</dt><dd>50 salones comerciales · 21 disponibles</dd></div></dl><div className="location-actions"><a className="primary-cta" href={GOOGLE_MAPS_URL} target="_blank" rel="noreferrer">Cómo llegar <span>↗</span></a><a className="outline-cta" href={PRIMARY_PHONE_HREF}>Llamar ahora <span>→</span></a></div></div>
      </section>

      <section className="faq-section"><div><p className="section-kicker">Preguntas frecuentes</p><h2>Datos claros.</h2></div><div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></section>

      <section className="contact-section" id="contacto">
        <div><p className="section-kicker light">Quiero alquilar</p><h2>Conocé las vacancias<br />y coordiná una visita.</h2><p>Indicá el código del salón que te interesa o contanos qué tipo de espacio buscás. La administración confirmará disponibilidad y condiciones.</p><a className="contact-phone" href={PRIMARY_PHONE_HREF}><small>Teléfono principal</small><strong>{PRIMARY_PHONE}</strong><span>→</span></a></div>
        <form className="inquiry-form" onSubmit={handleInquiry}>
          <label>Quiero consultar por<select name="kind" defaultValue="alquiler"><option value="alquiler">Alquiler de un salón</option><option value="producto">Un producto o servicio</option><option value="comerciante">Mi ficha como comerciante</option></select></label>
          <div className="field-pair"><label>Nombre y apellido<input name="name" required autoComplete="name" /></label><label>Teléfono / WhatsApp<input name="phone" required inputMode="tel" autoComplete="tel" /></label></div>
          <label>Salón o necesidad<textarea name="message" rows={4} required placeholder="Ej.: Me interesa PA-44 y quiero coordinar una visita." /></label>
          <button type="submit" disabled={formState === "sending"}>{formState === "sending" ? "Enviando…" : "Enviar consulta"}<span>→</span></button>
          <p className={`form-message ${formState}`}>{formState === "sent" ? "¡Gracias! Tu consulta fue registrada correctamente." : formState === "error" ? "No pudimos registrar la consulta. Probá nuevamente." : "Tus datos se usarán únicamente para responder esta consulta."}</p>
        </form>
      </section>

      <footer><a className="brand footer-brand" href="#inicio"><span className="brand-mark">AYC</span><span className="brand-copy"><strong>Electrónica</strong><small>Shopping &amp; tecnología</small></span></a><p>Un rincón de CDE en Asunción.<br /><a href={PRIMARY_PHONE_HREF}>{PRIMARY_PHONE}</a></p><div><a href="#disponibles">Salones disponibles</a><a href={GOOGLE_MAPS_URL} target="_blank" rel="noreferrer">Cómo llegar</a><a href="/gestion">Gestión</a></div><small>© 2026 AYC Electrónica · Asunción, Paraguay</small></footer>
    </main>
  );
}
