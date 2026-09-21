import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminApiError, getAdminDashboard } from "@/lib/admin/api";
import { getCurrentUser } from "@/lib/supabase/auth";
import type { AdminDashboardData, PaymentStatus } from "@/lib/domain/types";
import GeneratePaymentsButton, { type PaymentCandidate } from "./GeneratePaymentsButton";
import InquiryStatusButton from "./InquiryStatusButton";
import PaymentButton from "./PaymentButton";
import { signOutAction } from "./actions";

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

const emptyDashboard: AdminDashboardData = {
  units: [],
  unitCounts: { occupied: 0, available: 0, reserved: 0, maintenance: 0 },
  paymentCounts: {
    paid: { total: 0, amount: 0 },
    due: { total: 0, amount: 0 },
    overdue: { total: 0, amount: 0 },
  },
  zullyPaymentCounts: {
    paid: { total: 0, amount: 0 },
    due: { total: 0, amount: 0 },
    overdue: { total: 0, amount: 0 },
  },
  payments: [],
  inquiries: [],
};

export default async function ManagementPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/gestion");

  const now = new Date();
  const period = now.toISOString().slice(0, 7);
  let dashboard = emptyDashboard;
  let dashboardError: string | null = null;

  try {
    dashboard = await getAdminDashboard(period);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 401) redirect("/login?redirect=/gestion");
    console.error("[gestion] No se pudo cargar el panel:", error);
    dashboardError = "No pudimos cargar los datos administrativos. Reintentá en unos minutos.";
  }

  const { units, unitCounts, paymentCounts, zullyPaymentCounts, payments, inquiries } = dashboard;
  const totalUnits = Object.values(unitCounts).reduce((sum, count) => sum + count, 0);
  const expected = Object.values(paymentCounts).reduce((sum, row) => sum + row.amount, 0);
  const collected = paymentCounts.paid.amount;
  const collectionRate = expected ? Math.round((collected / expected) * 100) : 0;
  const aycPayments = payments.filter((payment) => payment.beneficiary !== "zully");
  const zullyPayments = payments.filter((payment) => payment.beneficiary === "zully");
  const zullyExpected = Object.values(zullyPaymentCounts).reduce((sum, row) => sum + row.amount, 0);
  const zullyUnits = units.filter((unit) => unit.beneficiary === "zully");
  const unitsWithPayment = new Set(payments.map((payment) => payment.unitId));
  const paymentCandidates: PaymentCandidate[] = units
    .filter((unit) => unit.status === "occupied" && unit.monthlyRent + unit.expensa > 0 && !unitsWithPayment.has(unit.id))
    .map((unit) => ({ unitId: unit.id, code: unit.code, amount: unit.monthlyRent + unit.expensa }));
  const aycPaymentCandidates = paymentCandidates.filter((candidate) => units.find((unit) => unit.id === candidate.unitId)?.beneficiary !== "zully");
  const zullyPaymentCandidates = paymentCandidates.filter((candidate) => units.find((unit) => unit.id === candidate.unitId)?.beneficiary === "zully");

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
          <div className="management-session">
            <span>{user.email ?? "Usuario autorizado"}</span>
            <form action={signOutAction}><button type="submit">Cerrar sesión</button></form>
          </div>
        </header>

        <div className={`demo-banner ${dashboardError ? "configuration-needed" : "connected"}`}>
          <strong>{dashboardError ? "Conexión interrumpida" : "Sesión protegida"}</strong>
          <span>{dashboardError ?? "Supabase Auth validó tu sesión y todos los datos se leen mediante endpoints privados del servidor."}</span>
        </div>

        <section className="kpi-grid" id="resumen">
          <article><span>Recaudación del mes</span><strong>{money.format(collected)}</strong><small>{collectionRate}% de lo facturado</small></article>
          <article><span>Cobros pendientes</span><strong>{paymentCounts.due.total}</strong><small>{money.format(paymentCounts.due.amount)}</small></article>
          <article className="warning"><span>Cobros atrasados</span><strong>{paymentCounts.overdue.total}</strong><small>{money.format(paymentCounts.overdue.amount)}</small></article>
          <article><span>Salones disponibles</span><strong>{unitCounts.available}</strong><small>de {totalUnits || 50} salones comerciales</small></article>
        </section>

        <section className="dashboard-panel" id="cobros">
          <div className="panel-heading">
            <div><span>Cartera del padre · AYC</span><h2>Alquiler + expensa</h2></div>
            <GeneratePaymentsButton candidates={aycPaymentCandidates} period={period} />
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Salón</th><th>Locatario</th><th>Cobro total</th><th>Canal</th><th>Estado</th><th>Fecha</th><th><span className="sr-only">Acciones</span></th></tr></thead>
              <tbody>{aycPayments.map((row) => (
                <tr key={row.id}>
                  <td><strong>{row.code}</strong><small>{row.floor}</small></td>
                  <td>{row.tenantName ?? "—"}</td>
                  <td className="payment-breakdown"><strong>{money.format(row.amount)}</strong><small>{money.format(row.monthlyRent)} alquiler + {money.format(row.expensa)} expensa</small></td>
                  <td><span className="channel-chip">{row.rentalChannel ?? "A confirmar"}</span></td>
                  <td><span className={`status-chip ${row.status}`}>{statusLabels[row.status]}</span></td>
                  <td>{row.paidOn ?? "—"}</td>
                  <td>{row.status !== "paid" && <PaymentButton paymentId={row.id} />}</td>
                </tr>
              ))}</tbody>
            </table>
            {aycPayments.length === 0 && <p className="no-inquiries">No hay cobros del padre registrados para {period}.</p>}
          </div>
        </section>

        <section className="dashboard-panel beneficiary-panel" id="cobros-zully">
          <div className="panel-heading">
            <div><span>Informativo · {zullyUnits.length} salones · {money.format(zullyExpected)} · no suma al total del padre</span><h2>Salones cuyo alquiler recibe Zully</h2></div>
            <GeneratePaymentsButton candidates={zullyPaymentCandidates} period={period} />
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Salón</th><th>Locatario</th><th>Cobro total</th><th>Canal</th><th>Estado</th><th>Fecha</th><th><span className="sr-only">Acciones</span></th></tr></thead>
              <tbody>{zullyPayments.map((row) => (
                <tr key={row.id}>
                  <td><strong>{row.code}</strong><small>{row.floor}</small></td>
                  <td>{row.tenantName ?? "—"}</td>
                  <td className="payment-breakdown"><strong>{money.format(row.amount)}</strong><small>{money.format(row.monthlyRent)} alquiler + {money.format(row.expensa)} expensa</small></td>
                  <td><span className="channel-chip">{row.rentalChannel ?? "A confirmar"}</span></td>
                  <td><span className={`status-chip ${row.status}`}>{statusLabels[row.status]}</span></td>
                  <td>{row.paidOn ?? "—"}</td>
                  <td>{row.status !== "paid" && <PaymentButton paymentId={row.id} />}</td>
                </tr>
              ))}</tbody>
            </table>
            {zullyPayments.length === 0 && <p className="no-inquiries">Los {zullyUnits.length} salones de Zully están separados de la cartera del padre. Sus importes aparecerán aquí cuando estén cargados.</p>}
          </div>
        </section>

        <div className="dashboard-columns">
          <section className="dashboard-panel" id="locales-admin">
            <div className="panel-heading"><div><span>Ocupación comercial</span><h2>Los {totalUnits || 50} salones</h2></div></div>
            <div className="occupancy-bar"><span style={{ width: `${totalUnits ? (unitCounts.occupied / totalUnits) * 100 : 0}%` }} /></div>
            <div className="occupancy-grid">
              <p><strong>{unitCounts.occupied}</strong>Ocupados</p>
              <p><strong>{unitCounts.available}</strong>Disponibles</p>
              <p><strong>{unitCounts.reserved}</strong>Reservados</p>
              <p><strong>{unitCounts.maintenance}</strong>En ajuste</p>
            </div>
            <div className="channel-summary">
              <span><strong>{units.filter((unit) => unit.rentalChannel === "directo").length}</strong> Directo</span>
              <span><strong>{units.filter((unit) => unit.rentalChannel === "propisur").length}</strong> Propisur</span>
              <span><strong>{units.filter((unit) => unit.rentalChannel === null).length}</strong> Por confirmar</span>
            </div>
          </section>

          <section className="dashboard-panel" id="consultas">
            <div className="panel-heading"><div><span>Nuevos contactos</span><h2>Consultas web</h2></div><strong>{inquiries.length}</strong></div>
            {inquiries.length ? <ul className="inquiry-list">{inquiries.map((row) => (
              <li key={row.id}>
                <div className="inquiry-copy"><strong>{row.name}</strong><small>{row.kind} · {new Date(row.createdAt).toLocaleDateString("es-PY")}</small><p>{row.message}</p></div>
                <div className="inquiry-controls"><a href={`tel:${row.phone}`}>{row.phone}</a><InquiryStatusButton inquiryId={row.id} /></div>
              </li>
            ))}</ul> : <p className="no-inquiries">Las consultas nuevas enviadas desde la web aparecerán aquí.</p>}
          </section>
        </div>
      </div>
    </main>
  );
}
