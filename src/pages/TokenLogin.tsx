import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";
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
    // Simulate network delay
    await new Promise(r => setTimeout(r, 600));

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
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <ShieldIcon />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Token Login</h1>
          <p className="mt-2 text-muted-foreground text-sm">Enter your access token to continue</p>
        </div>

        <div className="bg-card rounded-xl p-6 space-y-5 border border-border">
          <div className="text-left space-y-2">
            <label className="text-sm font-medium text-foreground">Access Token</label>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={token}
                onChange={e => setToken(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="tk_xxxxxxxxxxxxxxxx"
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring pr-10"
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
            className="w-full shimmer text-primary-foreground font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <LogIn size={18} />
            {loading ? "Verifying..." : "Login"}
          </button>
        </div>

        <p className="text-xs text-muted-foreground">Secure · Token-Based · Real-Time</p>
      </div>
    </div>
  );
};

export default TokenLogin;
