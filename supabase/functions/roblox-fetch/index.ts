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

async function placeToUniverse(placeId: number): Promise<number | null> {
  try {
    const r = await fetch(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`);
    if (!r.ok) return null;
    const j = await r.json();
    return j.universeId ?? null;
  } catch { return null; }
}

const GAMES = {
  BB:  { placeId: 4924922222 }, // Brookhaven
  ADM: { placeId: 920587237  }, // Adopt Me
  MM2: { placeId: 142823291  }, // Murder Mystery 2
};

async function countUserGamepasses(userId: number, universeId: number, cookie: string): Promise<number> {
  try {
    const passesRes = await fetch(`https://games.roblox.com/v1/games/${universeId}/game-passes?limit=50&sortOrder=Asc`);
    if (!passesRes.ok) return 0;
    const passes = await passesRes.json();
    const list: any[] = passes.data || [];
    let owned = 0;
    for (const p of list.slice(0, 20)) {
      const r = await rbx(`https://inventory.roblox.com/v1/users/${userId}/items/GamePass/${p.id}`, cookie);
      if (r.ok) {
        const j = await r.json();
        if ((j.data || []).length > 0) owned++;
      }
      if (owned >= 10) break;
    }
    return owned;
  } catch { return 0; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { cookie } = await req.json();
    if (!cookie || typeof cookie !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing cookie' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const info: Record<string, any> = {};

    const authRes = await rbx('https://users.roblox.com/v1/users/authenticated', cookie);
    if (!authRes.ok) {
      return new Response(JSON.stringify({ valid: false, error: 'Invalid cookie' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const me = await authRes.json();
    info.username = me.name;
    info.displayName = me.displayName;
    info.userId = me.id;
    info.cookie = cookie;

    info.avatarUrl = `https://www.roblox.com/headshot-thumbnail/image?userId=${me.id}&width=150&height=150&format=png`;
    try {
      const t = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${me.id}&size=150x150&format=Png`);
      if (t.ok) {
        const j = await t.json();
        if (j.data?.[0]?.imageUrl) info.avatarUrl = j.data[0].imageUrl;
      }
    } catch {}

    const [
      userRes, currencyRes, premiumRes, summaryRes, pendingRes,
      voiceRes, twoStepRes, emailRes, creditRes, savedPaymentRes, birthdateRes,
    ] = await Promise.all([
      rbx(`https://users.roblox.com/v1/users/${me.id}`, cookie),
      rbx(`https://economy.roblox.com/v1/users/${me.id}/currency`, cookie),
      rbx(`https://premiumfeatures.roblox.com/v1/users/${me.id}/validate-membership`, cookie),
      rbx(`https://economy.roblox.com/v2/users/${me.id}/transaction-totals?timeFrame=Year&transactionType=summary`, cookie),
      rbx(`https://www.roblox.com/my/account/PendingTransactions.json`, cookie).catch(() => null),
      rbx('https://voice.roblox.com/v1/settings', cookie).catch(() => null),
      rbx(`https://twostepverification.roblox.com/v1/users/${me.id}/configuration`, cookie).catch(() => null),
      rbx('https://accountsettings.roblox.com/v1/email', cookie).catch(() => null),
      rbx('https://billing.roblox.com/v1/credit', cookie).catch(() => null),
      rbx('https://billing.roblox.com/v1/payment-methods-unified', cookie).catch(() => null),
      rbx('https://accountinformation.roblox.com/v1/birthdate', cookie).catch(() => null),
    ]);

    if (userRes.ok) {
      const u = await userRes.json();
      if (u.created) {
        const days = Math.floor((Date.now() - new Date(u.created).getTime()) / 86400000);
        info.accountAgeDays = days;
      }
    }
    if (currencyRes.ok) info.robux = (await currencyRes.json()).robux ?? 0;
    if (premiumRes.ok) info.premium = (await premiumRes.json()) === true;
    if (summaryRes.ok) {
      const s = await summaryRes.json();
      info.robuxSpent = s.purchasesTotal ?? 0;
      info.robuxEarned = s.salesTotal ?? 0;
    }
    if (pendingRes && pendingRes.ok) {
      try { const p = await pendingRes.json(); info.pendingRobux = p.RobuxAmount ?? p.robuxAmount ?? 0; } catch {}
    }
    if (voiceRes && voiceRes.ok) {
      try {
        const v = await voiceRes.json();
        info.voiceChat = !!v.isVoiceEnabled;
        info.ageVerified = !!(v.isVerifiedForVoice ?? v.isUserOptIn);
      } catch {}
    }
    if (twoStepRes && twoStepRes.ok) {
      try {
        const t = await twoStepRes.json();
        const enabled = (t.methods || []).some((m: any) => m.enabled);
        info.has2FA = enabled;
      } catch {}
    }
    if (emailRes && emailRes.ok) {
      try {
        const e = await emailRes.json();
        info.emailVerified = !!e.verified;
        info.email = e.emailAddress || '';
      } catch {}
    }
    if (creditRes && creditRes.ok) {
      try { const c = await creditRes.json(); info.creditBalance = `${c.balance ?? 0} ${c.currencyCode || 'USD'}`; } catch {}
    }
    if (savedPaymentRes && savedPaymentRes.ok) {
      try {
        const s = await savedPaymentRes.json();
        const count = (s.paymentMethods || s.data || []).length;
        info.hasPayment = count > 0;
      } catch { info.hasPayment = false; }
    } else { info.hasPayment = false; }

    if (birthdateRes && birthdateRes.ok) {
      try {
        const b = await birthdateRes.json();
        if (b.birthYear) {
          const dob = new Date(b.birthYear, (b.birthMonth || 1) - 1, b.birthDay || 1);
          const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 86400000));
          info.userAge = age;
          info.under13 = age < 13;
        }
      } catch {}
    }

    try {
      const collectiblesRes = await rbx(`https://inventory.roblox.com/v1/users/${me.id}/assets/collectibles?limit=100`, cookie);
      if (collectiblesRes.ok) {
        const col = await collectiblesRes.json();
        const items = col.data || [];
        info.rap = items.reduce((acc: number, i: any) => acc + (i.recentAveragePrice || 0), 0);
      }

      const HEADLESS_ID = 134082579;
      const KORBLOX_IDS = [139607718, 139607625];
      const VALKYRIE_IDS = [1365767, 1029025]; // Valkyrie Helm + Golden Valkyrie

      const ownsAsset = async (id: number) => {
        const r = await rbx(`https://inventory.roblox.com/v1/users/${me.id}/items/Asset/${id}`, cookie);
        if (!r.ok) return false;
        try { const j = await r.json(); return (j.data || []).length > 0; } catch { return false; }
      };

      info.headless = await ownsAsset(HEADLESS_ID);
      info.korblox = false;
      for (const id of KORBLOX_IDS) if (await ownsAsset(id)) { info.korblox = true; break; }
      info.valkyrie = false;
      for (const id of VALKYRIE_IDS) if (await ownsAsset(id)) { info.valkyrie = true; break; }
    } catch {}

    try {
      const [uBB, uADM, uMM2] = await Promise.all([
        placeToUniverse(GAMES.BB.placeId),
        placeToUniverse(GAMES.ADM.placeId),
        placeToUniverse(GAMES.MM2.placeId),
      ]);
      const [bb, adm, mm2] = await Promise.all([
        uBB  ? countUserGamepasses(me.id, uBB,  cookie) : Promise.resolve(0),
        uADM ? countUserGamepasses(me.id, uADM, cookie) : Promise.resolve(0),
        uMM2 ? countUserGamepasses(me.id, uMM2, cookie) : Promise.resolve(0),
      ]);
      info.passesBB = bb;
      info.passesADM = adm;
      info.passesMM2 = mm2;
    } catch {}

    return new Response(JSON.stringify({ valid: true, info }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
