"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending}>{pending ? "Ingresando…" : "Ingresar al panel"}<span>→</span></button>;
}

export default function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form className="login-form" action={formAction}>
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <label>Correo electrónico<input name="email" type="email" required autoComplete="email" inputMode="email" /></label>
      <label>Contraseña<input name="password" type="password" required minLength={6} autoComplete="current-password" /></label>
      <SubmitButton />
      <p className={state.error ? "login-message error" : "login-message"} aria-live="polite">
        {state.error ?? "Acceso exclusivo para el equipo autorizado de AYC Electrónica."}
      </p>
    </form>
  );
}
