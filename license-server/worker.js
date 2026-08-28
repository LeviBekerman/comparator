/**
 * פנקס — License Server
 *
 * A tiny Cloudflare Worker that verifies a license key against Gumroad's
 * license API and returns a simple {valid, plan, ...} result. It never sees
 * or stores any bookkeeping data — only license keys and device ids.
 *
 * Deploy: see README.md in this folder.
 */

const GUMROAD_VERIFY_URL = 'https://api.gumroad.com/v2/licenses/verify';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cors = corsHeaders(env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }
    if (url.pathname === '/health') {
      return json({ ok: true }, 200, cors);
    }
    if (url.pathname === '/verify' && request.method === 'POST') {
      return handleVerify(request, env, cors);
    }
    return json({ error: 'not_found' }, 404, cors);
  },
};

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': (env && env.ALLOWED_ORIGIN) || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
  };
}

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), { status, headers });
}

async function handleVerify(request, env, cors) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ valid: false, error: 'invalid_request' }, 400, cors);
  }

  const licenseKey = String(body.key || '').trim();
  const activate = !!body.activate;
  if (!licenseKey) return json({ valid: false, error: 'missing_key' }, 400, cors);
  if (!env.GUMROAD_PRODUCT_PERMALINK) return json({ valid: false, error: 'server_not_configured' }, 500, cors);

  const cacheKey = `verify:${licenseKey}`;

  let gumroadResult;
  try {
    const resp = await fetch(GUMROAD_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        // The permalink from the product's public URL (gumroad.com/l/<this>) works
        // directly here - no need to create an OAuth Application just to look up
        // an internal product_id.
        product_permalink: env.GUMROAD_PRODUCT_PERMALINK,
        license_key: licenseKey,
        increment_uses_count: activate ? 'true' : 'false',
      }),
    });
    gumroadResult = await resp.json();
  } catch (err) {
    // Gumroad unreachable - fall back to the last known-good cached result
    // (KV is optional; without it this just fails closed).
    if (env.LICENSES) {
      const cached = await env.LICENSES.get(cacheKey, 'json');
      if (cached && cached.valid) {
        return json({ ...cached, fromCache: true }, 200, cors);
      }
    }
    return json({ valid: false, error: 'verification_unreachable' }, 502, cors);
  }

  if (!gumroadResult.success) {
    return json({ valid: false, error: gumroadResult.message || 'invalid_license' }, 200, cors);
  }

  const purchase = gumroadResult.purchase || {};
  const valid = !purchase.refunded && !purchase.chargebacked;
  const maxActivations = env.MAX_ACTIVATIONS ? parseInt(env.MAX_ACTIVATIONS, 10) : null;
  const overActivated = activate && maxActivations && gumroadResult.uses > maxActivations;

  const result = {
    valid: valid && !overActivated,
    plan: 'pro',
    email: purchase.email || null,
    uses: gumroadResult.uses,
    error: overActivated ? 'max_activations_reached' : (!valid ? 'refunded_or_chargebacked' : undefined),
  };

  if (env.LICENSES && result.valid) {
    await env.LICENSES.put(cacheKey, JSON.stringify(result), { expirationTtl: 60 * 60 * 24 * 30 });
  }

  return json(result, 200, cors);
}
