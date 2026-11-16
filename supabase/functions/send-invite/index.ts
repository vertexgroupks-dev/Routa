// Invites a person to the company: creates the invitation (role checks happen in the database)
// and emails a sign-up link through Supabase Auth. Returns the link too, so it can be sent by WhatsApp/SMS.
import { createClient } from 'npm:@supabase/supabase-js@2.49.8';

const URL_ = Deno.env.get('SUPABASE_URL')!;
const SITE = Deno.env.get('SITE_URL') ?? 'https://routalogistics.netlify.app';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  const auth = req.headers.get('authorization') ?? '';
  const asUser = createClient(URL_, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const admin = createClient(URL_, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { org_id, role, email, phone } = await req.json().catch(() => ({}));
  const { data, error } = await asUser.rpc('create_invitation', { p_org: org_id, p_role: role, p_email: email || null, p_phone: phone || null, p_hub: null });
  if (error) return Response.json({ error: error.message }, { status: 403, headers: cors });
  const link = `${SITE}/invite/${data.token}`;
  let emailed = false, note: string | null = null;
  if (email) {
    const r = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: link });
    if (r.error) note = /registered|exists/i.test(r.error.message) ? 'This email already has an account: send them the link to accept.' : r.error.message;
    else emailed = true;
  }
  return Response.json({ link, emailed, note }, { headers: cors });
});
