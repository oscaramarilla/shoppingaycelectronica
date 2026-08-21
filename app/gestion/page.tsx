import type { Metadata } from "next";
import Link from "next/link";
import { getAdminDashboard } from "@/lib/domain/data";
import type { PaymentStatus } from "@/lib/domain/types";
import PaymentButton from "./PaymentButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gestión de alquileres",
  robots: { index: false, follow: false },
};

const statusLabels: Record<PaymentStatus, string> = {
  paid: "Pagado",
  due: "Pendiente",
  overdue: "Atrasado",
};

const money = new Intl.NumberFormat("es-PY", {
  style: "currency",
  currency: "PYG",
  maximumFractionDigits: 0,
});

export default async function ManagementPage() {
  const now = new Date();
  const period = now.toISOString().slice(0, 7);
  const { configured, unitCounts, paymentCounts, payments, inquiries } = await getAdminDashboard(period);
  const totalUnits = Object.values(unitCounts).reduce((sum, count) => sum + count, 0);
  const expected = Object.values(paymentCounts).reduce((sum, row) => sum + row.amount, 0);
  const collected = paymentCounts.paid.amount;
  const collectionRate = expected ? Math.round((collected / expected) * 100) : 0;

  return (
    <main className="management-page">
      <aside className="management-sidebar">
        <Link className="brand management-brand" href="/">
          <span className="brand-mark">AYC</span>
          <span className="brand-copy"><strong>Gestión</strong><small>Administración</small></span>
        </Link>
        <nav aria-label="Secciones de gestión">
          <a className="active" href="#resumen">Resumen</a>
          <a href="#cobros">Cobros</a>
          <a href="#locales-admin">Locales</a>
          <a href="#consultas">Consultas</a>
        </nav>
        <Link className="back-public" href="/">← Ver sitio público</Link>
      </aside>

      <div className="management-content">
        <header className="management-header">
          <div><p>AYC Electrónica</p><h1>Control de alquileres</h1></div>
          <span>{new Intl.DateTimeFormat("es-PY", { month: "long", year: "numeric" }).format(now)}</span>
        </header>

        <div className={`demo-banner ${configured ? "connected" : "configuration-needed"}`}>
          <strong>{configured ? "Backend oficial" : "Configuración pendiente"}</strong>
          <span>{configured
            ? "Datos leídos en el servidor desde Supabase; la clave service-role nunca llega al navegador."
            : "Completá SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY para cargar los datos reales."}</span>
        </div>

        <section className="kpi-grid" id="resumen">
          <article><span>Recaudación del mes</span><strong>{money.format(collected)}</strong><small>{collectionRate}% de lo facturado</small></article>
          <article><span>Cobros pendientes</span><strong>{paymentCounts.due.total}</strong><small>{money.format(paymentCounts.due.amount)}</small></article>
          <article className="warning"><span>Cobros atrasados</span><strong>{paymentCounts.overdue.total}</strong><small>{money.format(paymentCounts.overdue.amount)}</small></article>
          <article><span>Locales disponibles</span><strong>{unitCounts.available}</strong><small>de {totalUnits || 75} unidades</small></article>
        </section>

        <section className="dashboard-panel" id="cobros">
          <div className="panel-heading"><div><span>Cartera del mes</span><h2>Estado de cobros</h2></div><p>Prioridad: atrasados y pendientes</p></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Local</th><th>Locatario</th><th>Alquiler</th><th>Estado</th><th>Fecha</th><th><span className="sr-only">Acciones</span></th></tr></thead>
              <tbody>{payments.map((row) => (
                <tr key={row.id}>
                  <td><strong>{row.code}</strong><small>{row.floor}</small></td>
                  <td>{row.tenantName ?? "—"}</td>
                  <td>{money.format(row.amount)}</td>
                  <td><span className={`status-chip ${row.status}`}>{statusLabels[row.status]}</span></td>
                  <td>{row.paidOn ?? "—"}</td>
                  <td>{row.status !== "paid" && <PaymentButton paymentId={row.id} />}</td>
                </tr>
              ))}</tbody>
            </table>
            {payments.length === 0 && <p className="no-inquiries">No hay cobros registrados para {period}.</p>}
          </div>
        </section>

        <div className="dashboard-columns">
          <section className="dashboard-panel" id="locales-admin">
            <div className="panel-heading"><div><span>Ocupación</span><h2>Los 75 locales</h2></div></div>
            <div className="occupancy-bar"><span style={{ width: `${totalUnits ? (unitCounts.occupied / totalUnits) * 100 : 0}%` }} /></div>
            <div className="occupancy-grid">
              <p><strong>{unitCounts.occupied}</strong>Ocupados</p>
              <p><strong>{unitCounts.available}</strong>Disponibles</p>
              <p><strong>{unitCounts.reserved}</strong>Reservados</p>
              <p><strong>{unitCounts.maintenance}</strong>En ajuste</p>
            </div>
          </section>

          <section className="dashboard-panel" id="consultas">
            <div className="panel-heading"><div><span>Nuevos contactos</span><h2>Consultas web</h2></div><strong>{inquiries.length}</strong></div>
            {inquiries.length ? <ul className="inquiry-list">{inquiries.map((row) => (
              <li key={row.id}>
                <div><strong>{row.name}</strong><small>{row.kind} · {new Date(row.createdAt).toLocaleDateString("es-PY")}</small></div>
                <a href={`tel:${row.phone}`}>{row.phone}</a>
              </li>
            ))}</ul> : <p className="no-inquiries">Las consultas nuevas enviadas desde la web aparecerán aquí.</p>}
          </section>
        </div>
      </div>
    </main>
  );
}
