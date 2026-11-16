// Sends queued messages: merchant webhooks (signed) and customer SMS (Infobip or Twilio, when configured).
// Called every minute by pg_cron. Safe to call any time: it only picks up queued messages.
import { createClient } from 'npm:@supabase/supabase-js@2.49.8';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

async function hmac(secret: string, body: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sendSms(to: string, text: string): Promise<{ ok: boolean; id?: string; error?: string; skipped?: boolean }> {
  const ibKey = Deno.env.get('INFOBIP_API_KEY'), ibBase = Deno.env.get('INFOBIP_BASE_URL');
  const sender = Deno.env.get('SMS_SENDER') ?? 'Routa';
  if (ibKey && ibBase) {
    const r = await fetch(`https://${ibBase}/sms/2/text/advanced`, {
      method: 'POST', headers: { Authorization: `App ${ibKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ from: sender, destinations: [{ to: to.replace(/^\+/, '') }], text }] })
    });
    const j = await r.json().catch(() => ({}));
    return r.ok ? { ok: true, id: j?.messages?.[0]?.messageId } : { ok: false, error: JSON.stringify(j).slice(0, 300) };
  }
  const sid = Deno.env.get('TWILIO_ACCOUNT_SID'), token = Deno.env.get('TWILIO_AUTH_TOKEN'), from = Deno.env.get('TWILIO_FROM');
  if (sid && token && from) {
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST', headers: { Authorization: 'Basic ' + btoa(`${sid}:${token}`), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ To: to, From: from, Body: text })
    });
    const j = await r.json().catch(() => ({}));
    return r.ok ? { ok: true, id: j?.sid } : { ok: false, error: (j?.message ?? 'Twilio error').slice(0, 300) };
  }
  return { ok: false, skipped: true }; // no provider yet: keep it queued
}

Deno.serve(async () => {
  const { data: msgs, error } = await db.from('outbound_messages').select('*').in('status', ['queued', 'pending']).order('created_at').limit(100);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  let sent = 0, failed = 0, waiting = 0;
  for (const m of msgs ?? []) {
    let res: { ok: boolean; id?: string; error?: string; skipped?: boolean };
    try {
      if (m.channel === 'webhook') {
        const payload = JSON.parse(m.body);
        const { data: ep } = await db.from('webhook_endpoints').select('secret, active').eq('id', payload.endpoint_id).maybeSingle();
        if (!ep?.active) { res = { ok: false, error: 'Endpoint disabled' }; }
        else {
          const r = await fetch(m.to_address, {
            method: 'POST', signal: AbortSignal.timeout(8000),
            headers: { 'Content-Type': 'application/json', 'X-Routa-Event': payload.event, 'X-Routa-Signature': await hmac(ep.secret, m.body) },
            body: m.body
          });
          res = r.ok ? { ok: true, id: String(r.status) } : { ok: false, error: `HTTP ${r.status}` };
        }
      } else if (m.channel === 'sms') {
        res = await sendSms(m.to_address, m.body);
      } else {
        res = { ok: false, skipped: true };
      }
    } catch (e) {
      res = { ok: false, error: String(e).slice(0, 300) };
    }
    if (res.skipped) { waiting++; continue; }
    await db.from('outbound_messages').update(res.ok ? { status: 'sent', sent_at: new Date().toISOString(), provider_id: res.id ?? null, error: null } : { status: 'failed', error: res.error }).eq('id', m.id);
    res.ok ? sent++ : failed++;
  }
  return Response.json({ sent, failed, waiting_for_provider: waiting });
});
