import { useEffect, useState } from "react";
import { Users, Circle } from "lucide-react";
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
    <a
      href={info.url}
      target="_blank"
      rel="noopener noreferrer"
      className="absolute bottom-4 left-4 right-4 bg-secondary/60 hover:bg-secondary border border-border/50 hover:border-primary/40 rounded-xl p-3 flex items-center gap-3 transition-all duration-300 hover:scale-[1.02] animate-fade-in"
    >
      {info.iconUrl ? (
        <img src={info.iconUrl} alt={info.name} className="w-10 h-10 rounded-lg border border-border/50" />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
          {info.name.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{info.name}</p>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Circle size={6} className="fill-[hsl(var(--success))] text-[hsl(var(--success))]" />
            {info.online.toLocaleString()} online
          </span>
          <span className="flex items-center gap-1">
            <Users size={9} />
            {info.members.toLocaleString()}
          </span>
        </div>
      </div>
    </a>
  );
};

export default DiscordSidebarFooter;