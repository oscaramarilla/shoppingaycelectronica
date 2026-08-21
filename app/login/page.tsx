import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";
import LoginForm from "./LoginForm";
import { normalizeAdminRedirect } from "@/lib/admin/redirect";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Acceso administrativo",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect: requestedRedirect } = await searchParams;
  const redirectTo = normalizeAdminRedirect(requestedRedirect);
  const user = await getCurrentUser();
  if (user) redirect(redirectTo);

  return (
    <main className="login-page">
      <section className="login-card">
        <Link className="brand login-brand" href="/" aria-label="Volver a AYC Electrónica">
          <span className="brand-mark">AYC</span>
          <span className="brand-copy"><strong>Electrónica</strong><small>Gestión segura</small></span>
        </Link>
        <p className="section-kicker">Área administrativa</p>
        <h1>Controlá los alquileres<br /><em>desde un solo lugar.</em></h1>
        <p className="login-lede">Iniciá sesión con la cuenta habilitada en Supabase para gestionar locales, cobros y consultas.</p>
        <LoginForm redirectTo={redirectTo} />
        <Link className="login-back" href="/">← Volver al sitio público</Link>
      </section>
      <aside className="login-aside" aria-hidden="true">
        <div><span>75</span><strong>locales</strong></div>
        <div><span>3</span><strong>niveles</strong></div>
        <p>AYC / Mercado 4<br />Asunción · Paraguay</p>
      </aside>
    </main>
  );
}
