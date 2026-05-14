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
