import { useEffect, useState } from "react";
import { X, Users, Circle } from "lucide-react";

const STORAGE_KEY = "discord_popup_last_shown";
const ONE_HOUR = 60 * 60 * 1000;

interface Invite {
  code: string;
  guildName: string;
  iconUrl?: string;
  memberCount?: number;
  onlineCount?: number;
}

function parseInviteCode(url: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:discord\.gg\/|discord\.com\/invite\/)([A-Za-z0-9-]+)/);
  return m ? m[1] : (url.trim().length < 32 && /^[A-Za-z0-9-]+$/.test(url.trim()) ? url.trim() : null);
}

const DiscordInvitePopup = () => {
  const [invite, setInvite] = useState<Invite | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const url = localStorage.getItem("discord_invite_url") || "";
    const code = parseInviteCode(url);
    if (!code) return;

    const last = Number(localStorage.getItem(STORAGE_KEY) || 0);
    if (Date.now() - last < ONE_HOUR) return;

    (async () => {
      try {
        const r = await fetch(`https://discord.com/api/v10/invites/${code}?with_counts=true&with_expiration=true`);
        if (!r.ok) return;
        const j = await r.json();
        const guild = j.guild || {};
        setInvite({
          code,
          guildName: guild.name || "Discord Server",
          iconUrl: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128` : undefined,
          memberCount: j.approximate_member_count,
          onlineCount: j.approximate_presence_count,
        });
        setOpen(true);
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
      } catch {/* ignore */}
    })();
  }, []);

  if (!open || !invite) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-background/70 backdrop-blur-sm animate-fade-in-up">
      <div className="card-glow rounded-2xl max-w-sm w-full p-6 relative">
        <button onClick={() => setOpen(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1">
          <X size={16} />
        </button>
        <div className="flex flex-col items-center text-center space-y-4">
          {invite.iconUrl ? (
            <img src={invite.iconUrl} alt={invite.guildName} className="w-20 h-20 rounded-2xl border border-primary/30 glow-border" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-2xl font-black text-primary">
              {invite.guildName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-lg font-black text-foreground glow-text">{invite.guildName}</h2>
            <p className="text-xs text-muted-foreground mt-1">Join our Discord community</p>
          </div>
          <div className="flex gap-4 text-xs">
            {typeof invite.onlineCount === "number" && (
              <div className="flex items-center gap-1.5"><Circle size={8} className="fill-[hsl(var(--success))] text-[hsl(var(--success))]" /><span className="text-foreground">{invite.onlineCount.toLocaleString()} Online</span></div>
            )}
            {typeof invite.memberCount === "number" && (
              <div className="flex items-center gap-1.5"><Users size={12} className="text-muted-foreground" /><span className="text-foreground">{invite.memberCount.toLocaleString()} Members</span></div>
            )}
          </div>
          <a
            href={`https://discord.gg/${invite.code}`}
            target="_blank" rel="noopener noreferrer"
            className="w-full shimmer text-primary-foreground font-semibold py-3 rounded-xl glow-btn transition-all"
          >
            Join Server
          </a>
        </div>
      </div>
    </div>
  );
};

export default DiscordInvitePopup;
