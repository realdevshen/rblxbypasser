import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Zap, ArrowLeft } from "lucide-react";
import ShieldIcon from "@/components/ShieldIcon";
import { validateToken, sendDiscordWebhook } from "@/lib/tokenStore";
import { toast } from "sonner";

const WEBHOOK_KEY = 'discord_webhook_url';

const TokenLogin = () => {
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!token.trim()) {
      toast.error("Please enter a token");
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));

    const result = validateToken(token.trim());
    if (result) {
      const webhook = localStorage.getItem(WEBHOOK_KEY);
      if (webhook) {
        sendDiscordWebhook(webhook, `✅ Token **${result.label}** was used to login.`);
      }
      toast.success("Access granted!");
      sessionStorage.setItem("authenticated", "true");
      sessionStorage.setItem("token_label", result.label);
      navigate("/dashboard");
    } else {
      toast.error("Invalid or expired token");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm space-y-8 text-center relative z-10 animate-fade-in-up">
        <button
          onClick={() => navigate("/")}
          className="absolute -top-2 left-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
        </button>

        <ShieldIcon size="lg" />

        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight text-foreground glow-text">
            Token Login
          </h1>
          <p className="text-muted-foreground text-sm">
            Enter your access token to continue
          </p>
        </div>

        <div className="card-glow rounded-2xl p-6 space-y-5">
          <div className="text-left space-y-2">
            <label className="text-sm font-semibold text-foreground">Access Token</label>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={token}
                onChange={e => setToken(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="tk_xxxxxxxxxxxxxxxx"
                className="input-field pr-10"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full shimmer text-primary-foreground font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2.5 glow-btn transition-all duration-300 disabled:opacity-50"
          >
            <Zap size={18} />
            {loading ? "Verifying..." : "Login"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default TokenLogin;
