// In-memory token store (resets on refresh - for demo purposes)
// In production, use a database via Lovable Cloud

export interface Token {
  id: string;
  token: string;
  label: string;
  createdAt: Date;
  used: boolean;
}

const STORAGE_KEY = 'app_tokens';

function loadTokens(): Token[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map((t: any) => ({ ...t, createdAt: new Date(t.createdAt) }));
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

export function generateToken(label: string): Token {
  const token: Token = {
    id: crypto.randomUUID(),
    token: `tk_${crypto.randomUUID().replace(/-/g, '')}`,
    label,
    createdAt: new Date(),
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
  if (found) {
    found.used = true;
    saveTokens(tokens);
    return found;
  }
  return null;
}

export function deleteToken(id: string) {
  const tokens = loadTokens().filter(t => t.id !== id);
  saveTokens(tokens);
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
