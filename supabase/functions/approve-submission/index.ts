// WhatBlox approve-submission Edge Function
// Deploy: supabase functions deploy approve-submission --no-verify-jwt
//
// Required Supabase project secrets:
//   SUPABASE_URL                              (auto-injected by Supabase)
//   SUPABASE_SERVICE_ROLE_KEY                 (auto-injected by Supabase)
//   WHATBLOX_ADMIN_PASSWORD_HASH              SHA-256 hex of admin password (set manually)
//   ROBLOX_PROXY_BASE                         optional, defaults to https://games.roproxy.com/v1
//
// Request:
//   POST /functions/v1/approve-submission
//   Headers: Authorization: Bearer <sha256-hex-of-admin-password>
//   Body: { submission_id: string, action: 'approve' | 'reject', reviewer_note?: string }
//
// Response: { ok: true, game_id?: string }   (game_id present only on approve)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ADMIN_HASH = Deno.env.get('WHATBLOX_ADMIN_PASSWORD_HASH') || '';
const ROBLOX_PROXY_BASE = Deno.env.get('ROBLOX_PROXY_BASE') || 'https://games.roproxy.com/v1';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

// Deterministic gradient + icon mapping (mirrors mapRobloxGameToWhatBlox in client).
const GRADIENTS: [string, string][] = [
  ['#1A1A2E', '#16213E'],
  ['#0F0F23', '#1A1A3E'],
  ['#1B0A2E', '#2D1B4E'],
  ['#0D1B1A', '#1A2E2B'],
  ['#1E3A5F', '#2E5A8F'],
  ['#2D4A2B', '#3D6B3A'],
  ['#2E1A1A', '#4A2A2A'],
  ['#3D2A0A', '#5D4A1A'],
  ['#2E1A3D', '#4A2A5E'],
  ['#1A2E1A', '#2A4A2A'],
];
const ICONS = ['gamepad2','sword','castle','radio','feather','swords','car','gem','music','mapPin','brain','heart','star','zap','shield'];

function gradientAndIcon(id: string | number): { gradient_from: string; gradient_to: string; icon_name: string } {
  const hash = String(id).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const g = GRADIENTS[hash % GRADIENTS.length];
  return { gradient_from: g[0], gradient_to: g[1], icon_name: ICONS[hash % ICONS.length] };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  // --- Auth: bearer = sha256(admin password) must equal stored hash ---
  const auth = req.headers.get('authorization') || '';
  const bearer = auth.replace(/^Bearer\s+/i, '').trim();
  if (!ADMIN_HASH) return json({ error: 'admin_auth_not_configured' }, 500);
  if (!bearer || bearer !== ADMIN_HASH) return json({ error: 'unauthorized' }, 401);

  // --- Parse body ---
  let body: { submission_id?: string; action?: string; reviewer_note?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  const submissionId = body.submission_id;
  const action = body.action;
  if (!submissionId || (action !== 'approve' && action !== 'reject')) {
    return json({ error: 'invalid_request', detail: 'submission_id and action(approve|reject) required' }, 400);
  }

  // --- Service-role client (bypasses RLS) ---
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  // --- Load submission ---
  const { data: sub, error: subErr } = await sb
    .from('game_submissions')
    .select('*')
    .eq('id', submissionId)
    .single();
  if (subErr || !sub) return json({ error: 'submission_not_found' }, 404);
  if (sub.status !== 'pending') return json({ error: 'already_reviewed', status: sub.status }, 409);

  // --- Approve path ---
  if (action === 'approve') {
    // Fetch live metadata from Roblox proxy.
    let game: { id: number; name: string; description?: string; creator?: { name?: string }; rootPlace?: { id?: number }; universeId?: number; genre?: string; playing?: number; visits?: number } | null = null;
    try {
      const url = `${ROBLOX_PROXY_BASE}/games?universeIds=${encodeURIComponent(String(sub.universe_id))}`;
      const resp = await fetch(url, { headers: { Accept: 'application/json' } });
      if (resp.ok) {
        const data = await resp.json();
        game = (data?.data && data.data[0]) || null;
      }
    } catch { /* swallow; we still have stored snapshot from submission */ }

    const title       = game?.name      || sub.title;
    const developer  = game?.creator?.name || sub.developer;
    const description= game?.description || 'No description available.';
    const genre      = (sub.genre && sub.genre.length) ? sub.genre : (game?.genre || 'Other');
    const players    = game?.playing   || 0;
    const visits     = (game?.visits   || 0);
    const rootPlace  = game?.rootPlace?.id || sub.universe_id;
    const { gradient_from, gradient_to, icon_name } = gradientAndIcon(sub.universe_id);
    const roblox_url = sub.roblox_url || `https://www.roblox.com/games/${rootPlace}`;
    const gameId = String((game && (game as any).universeId) || sub.universe_id);

    // Insert into public.games. Use upsert keyed on id (universeId string) for idempotency
    // if a previous approved row already exists.
    const { error: insertErr } = await sb.from('games').upsert({
      id: gameId,
      title,
      genre,
      developer: developer || 'Unknown',
      players_now: players,
      total_visits: visits,
      description,
      gradient_from,
      gradient_to,
      icon_name,
      roblox_url,
    }, { onConflict: 'id' });

    if (insertErr) return json({ error: 'games_insert_failed', detail: insertErr.message }, 500);

    const { error: updErr } = await sb.from('game_submissions')
      .update({ status: 'approved', reviewer_note: body.reviewer_note || null, reviewed_at: new Date().toISOString() })
      .eq('id', submissionId);
    if (updErr) return json({ error: 'submission_update_failed', detail: updErr.message }, 500);

    return json({ ok: true, game_id: gameId });
  }

  // --- Reject path ---
  const { error: updErr } = await sb.from('game_submissions')
    .update({ status: 'rejected', reviewer_note: body.reviewer_note || null, reviewed_at: new Date().toISOString() })
    .eq('id', submissionId);
  if (updErr) return json({ error: 'submission_update_failed', detail: updErr.message }, 500);

  return json({ ok: true });
});
