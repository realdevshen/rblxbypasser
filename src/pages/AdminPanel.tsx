import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Copy, Settings, LogOut, Webhook } from "lucide-react";
import { getTokens, generateToken, deleteToken, Token } from "@/lib/tokenStore";
import { toast } from "sonner";

const WEBHOOK_KEY = "discord_webhook_url";

const AdminPanel = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [label, setLabel] = useState("");
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
    const newToken = generateToken(label.trim());
    setTokens(getTokens());
    setLabel("");
    toast.success(`Token generated: ${newToken.token.slice(0, 12)}...`);
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
    navigate("/admin-login");
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
          <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground transition-colors">
            <LogOut size={20} />
          </button>
        </div>

        {/* Generate Token */}
        <div className="bg-card rounded-xl p-5 border border-border space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Plus size={18} className="text-primary" /> Generate Token
          </h2>
          <div className="flex gap-2">
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleGenerate()}
              placeholder="Token label (e.g. User1)"
              className="flex-1 bg-secondary border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
            <button
              onClick={handleGenerate}
              className="bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Generate
            </button>
          </div>
        </div>

        {/* Token List */}
        <div className="bg-card rounded-xl p-5 border border-border space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Tokens ({tokens.length})</h2>
          {tokens.length === 0 ? (
            <p className="text-muted-foreground text-sm">No tokens generated yet.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {tokens.map(t => (
                <div key={t.id} className="flex items-center justify-between bg-secondary rounded-lg px-4 py-3 border border-border">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{t.label}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{t.token}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {t.used && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full mr-1">Used</span>
                    )}
                    <button onClick={() => handleCopy(t.token)} className="text-muted-foreground hover:text-foreground p-1">
                      <Copy size={14} />
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="text-muted-foreground hover:text-destructive p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Discord Webhook */}
        <div className="bg-card rounded-xl p-5 border border-border space-y-4">
          <button
            onClick={() => setShowWebhook(!showWebhook)}
            className="flex items-center gap-2 text-lg font-semibold text-foreground w-full"
          >
            <Webhook size={18} className="text-primary" /> Discord Webhook
          </button>
          {showWebhook && (
            <div className="space-y-3">
              <input
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              />
              <button
                onClick={saveWebhook}
                className="bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
              >
                Save Webhook
              </button>
              <p className="text-xs text-muted-foreground">
                Webhook will send an embed to Discord when a token is used to login.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
