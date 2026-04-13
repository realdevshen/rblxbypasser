import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Copy, LogOut, Webhook, ArrowLeft, Clock, Key, ChevronDown, ChevronUp } from "lucide-react";
import { getTokens, generateToken, deleteToken, isTokenExpired, Token } from "@/lib/tokenStore";
import { toast } from "sonner";

const WEBHOOK_KEY = "discord_webhook_url";

const AdminPanel = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [label, setLabel] = useState("");
  const [expiryHours, setExpiryHours] = useState(24);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [showWebhook, setShowWebhook] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem("admin") !== "true") {
      navigate("/admin-login");
      return;
    }
    setTokens(getTokens());
    setWebhookUrl(localStorage.getItem(WEBHOOK_KEY) || "");
  }, [navigate]);

  const handleGenerate = () => {
    if (!label.trim()) {
      toast.error("Enter a label for the token");
      return;
    }
    const newToken = generateToken(label.trim(), expiryHours);
    setTokens(getTokens());
    setLabel("");
    toast.success(`Token generated!`);
    navigator.clipboard.writeText(newToken.token);
    toast.info("Token copied to clipboard");
  };

  const handleDelete = (id: string) => {
    deleteToken(id);
    setTokens(getTokens());
    toast.success("Token deleted");
  };

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success("Copied to clipboard");
  };

  const saveWebhook = () => {
    localStorage.setItem(WEBHOOK_KEY, webhookUrl);
    toast.success("Discord webhook saved");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin");
    navigate("/");
  };

  const activeCount = tokens.filter(t => !t.used && !isTokenExpired(t)).length;
  const usedCount = tokens.filter(t => t.used).length;

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-lg mx-auto space-y-5 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">{tokens.length} tokens · {activeCount} active</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground transition-colors p-2">
            <LogOut size={18} />
          </button>
        </div>

        {/* Generate Token */}
        <div className="card-glow rounded-2xl p-5 space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
              <Plus size={14} className="text-primary" />
            </div>
            Generate Token
          </h2>
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleGenerate()}
            placeholder="Token label (e.g. User1)"
            className="input-field"
          />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Clock size={14} className="text-muted-foreground" />
              <select
                value={expiryHours}
                onChange={e => setExpiryHours(Number(e.target.value))}
                className="bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring flex-1"
              >
                <option value={1}>1 hour</option>
                <option value={6}>6 hours</option>
                <option value={12}>12 hours</option>
                <option value={24}>24 hours</option>
                <option value={72}>3 days</option>
                <option value={168}>7 days</option>
              </select>
            </div>
            <button
              onClick={handleGenerate}
              className="shimmer text-primary-foreground px-5 py-2 rounded-xl font-semibold text-sm glow-btn transition-all duration-300 flex items-center gap-1.5"
            >
              <Key size={14} /> Generate
            </button>
          </div>
        </div>

        {/* Token List */}
        <div className="card-glow rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Tokens</h2>
            <div className="flex gap-2">
              <span className="status-online text-[10px] px-2 py-0.5 rounded-full font-medium">{activeCount} active</span>
              <span className="status-used text-[10px] px-2 py-0.5 rounded-full font-medium">{usedCount} used</span>
            </div>
          </div>
          {tokens.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">No tokens generated yet.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {tokens.map(t => {
                const expired = isTokenExpired(t);
                return (
                  <div key={t.id} className="flex items-center gap-3 bg-secondary/50 rounded-xl px-3.5 py-3 border border-border/50 group hover:border-border transition-colors">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${expired ? 'bg-destructive' : t.used ? 'bg-primary' : 'bg-[hsl(var(--success))]'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{t.label}</p>
                      <p className="text-[11px] text-muted-foreground font-mono truncate">{t.token}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {expired && <span className="status-expired text-[10px] px-1.5 py-0.5 rounded-full">Exp</span>}
                      {t.used && <span className="status-used text-[10px] px-1.5 py-0.5 rounded-full">Used</span>}
                      <button onClick={() => handleCopy(t.token)} className="text-muted-foreground hover:text-foreground p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Copy size={13} />
                      </button>
                      <button onClick={() => handleDelete(t.id)} className="text-muted-foreground hover:text-destructive p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Discord Webhook */}
        <div className="card-glow rounded-2xl p-5 space-y-3">
          <button
            onClick={() => setShowWebhook(!showWebhook)}
            className="flex items-center justify-between w-full"
          >
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                <Webhook size={14} className="text-primary" />
              </div>
              Discord Webhook
            </h2>
            {showWebhook ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
          </button>
          {showWebhook && (
            <div className="space-y-3 pt-1">
              <input
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                className="input-field text-sm"
              />
              <button
                onClick={saveWebhook}
                className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity w-full"
              >
                Save Webhook
              </button>
              <p className="text-[11px] text-muted-foreground">
                Sends a Discord embed when a token is used to log in or when bypass is triggered.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
