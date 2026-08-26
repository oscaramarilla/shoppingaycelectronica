"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/auth";

export async function signOutAction() {
  const supabase = await createServerSupabase();
  if (supabase) await supabase.auth.signOut();
  redirect("/login");
}
