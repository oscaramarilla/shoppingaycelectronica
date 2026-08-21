"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/auth";
import { normalizeAdminRedirect } from "@/lib/admin/redirect";

export type LoginState = { error: string | null };

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6).max(200),
  redirectTo: z.string().optional(),
});

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    redirectTo: formData.get("redirectTo"),
  });

  if (!parsed.success) {
    return { error: "Ingresá un correo válido y tu contraseña." };
  }

  const supabase = await createServerSupabase();
  if (!supabase) {
    return { error: "El acceso administrativo todavía no está configurado." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: "No pudimos iniciar sesión. Revisá el correo y la contraseña." };
  }

  redirect(normalizeAdminRedirect(parsed.data.redirectTo));
}
