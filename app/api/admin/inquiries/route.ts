// ============================================================
// GET /api/admin/inquiries — bandeja de consultas. Protegido.
// ============================================================

import { requireUser } from '@/lib/admin/guard';
import { getServiceClient } from '@/lib/supabase/server';
import { json } from '@/lib/http';

const INQUIRY_COLUMNS = 'id, kind, name, phone, message, status, created_at, updated_at';

export async function GET(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const supabase = getServiceClient();
  if (!supabase) return json({ ok: false, error: 'storage_unavailable' }, 503);

  const { searchParams } = new URL(req.url);
  let query = supabase.from('inquiries').select(INQUIRY_COLUMNS);
  const status = searchParams.get('status');
  if (status) query = query.eq('status', status);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
    console.error('[admin/inquiries] GET', error.message);
    return json({ ok: false, error: 'storage_error' }, 502);
  }
  return json({ ok: true, inquiries: data ?? [] }, 200);
}
