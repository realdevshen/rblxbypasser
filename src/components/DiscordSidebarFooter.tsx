import { useEffect, useState } from "react";
import { Users, Circle, ExternalLink } from "lucide-react";
import { WK, getWebhook } from "@/lib/tokenStore";

interface InviteInfo {
  name: string;
  iconUrl: string | null;
  members: number;
  online: number;
  url: string;
}

function extractCode(url: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:discord\.gg|discord\.com\/invite)\/([A-Za-z0-9-]+)/i);
  return m ? m[1] : url.trim().replace(/^\/+|\/+$/g, "").split("/").pop() || null;
}

const DiscordSidebarFooter = () => {
  const [info, setInfo] = useState<InviteInfo | null>(null);

  useEffect(() => {
    const inviteUrl = getWebhook(WK.discordInvite);
    const code = extractCode(inviteUrl);
    if (!code) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`https://discord.com/api/v10/invites/${code}?with_counts=true`);
        if (!res.ok) return;
        const d = await res.json();
        if (cancelled || !d?.guild) return;
        const icon = d.guild.icon
          ? `https://cdn.discordapp.com/icons/${d.guild.id}/${d.guild.icon}.png?size=128`
          : null;
        setInfo({
          name: d.guild.name,
          iconUrl: icon,
          members: d.approximate_member_count ?? 0,
          online: d.approximate_presence_count ?? 0,
          url: inviteUrl.startsWith("http") ? inviteUrl : `https://discord.gg/${code}`,
        });
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!info) return null;

  return (
    <div className="absolute bottom-4 left-4 right-4 animate-fade-in">
      <a
        href={info.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block overflow-hidden rounded-xl border border-primary/30 hover:border-primary/60 bg-gradient-to-br from-primary/15 via-secondary/60 to-background/80 backdrop-blur-sm p-3 transition-all duration-300 hover:shadow-[0_0_24px_hsl(var(--primary)/0.35)] hover:-translate-y-0.5"
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.25),transparent_60%)] pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="relative shrink-0">
            {info.iconUrl ? (
              <img
                src={info.iconUrl}
                alt={info.name}
                className="w-11 h-11 rounded-lg border border-border/50 object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-11 h-11 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-sm font-bold text-primary">
                {info.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[hsl(var(--success))] border-2 border-card animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-sm font-bold text-foreground truncate">{info.name}</p>
              <ExternalLink size={10} className="text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-[10px] uppercase tracking-wider text-primary/80 font-semibold">Discord Server</p>
            <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Circle size={6} className="fill-[hsl(var(--success))] text-[hsl(var(--success))]" />
                <span className="text-foreground font-medium">{info.online.toLocaleString()}</span>
              </span>
              <span className="text-border">•</span>
              <span className="flex items-center gap-1">
                <Users size={10} />
                <span className="text-foreground font-medium">{info.members.toLocaleString()}</span>
              </span>
            </div>
          </div>
        </div>
      </a>
    </div>
  );
};

export default DiscordSidebarFooter;