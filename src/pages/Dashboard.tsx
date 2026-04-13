import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, LogOut, ArrowLeft, Key, Clock, Activity, User } from "lucide-react";
import { getTokens, getLoginLog, isTokenExpired } from "@/lib/tokenStore";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, used: 0, expired: 0, active: 0 });
  const [recentLogins, setRecentLogins] = useState<{ tokenLabel: string; timestamp: Date }[]>([]);
  const [tokenLabel, setTokenLabel] = useState("");

  useEffect(() => {
    if (sessionStorage.getItem("authenticated") !== "true") {
      navigate("/");
      return;
    }
    setTokenLabel(sessionStorage.getItem("token_label") || "User");

    const tokens = getTokens();
    const used = tokens.filter(t => t.used).length;
    const expired = tokens.filter(t => isTokenExpired(t)).length;
    const active = tokens.filter(t => !t.used && !isTokenExpired(t)).length;
    setStats({ total: tokens.length, used, expired, active });

    setRecentLogins(getLoginLog().slice(0, 8));
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem("authenticated");
    sessionStorage.removeItem("token_label");
    navigate("/");
  };

  const formatTime = (d: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  const statCards = [
    { label: "Total Tokens", value: stats.total, icon: Key, color: "text-primary" },
    { label: "Active", value: stats.active, icon: ShieldCheck, color: "text-emerald-400" },
    { label: "Used", value: stats.used, icon: Activity, color: "text-amber-400" },
    { label: "Expired", value: stats.expired, icon: Clock, color: "text-red-400" },
  ];

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          </div>
          <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 text-sm">
            <LogOut size={16} /> Logout
          </button>
        </div>

        {/* User Info */}
        <div className="bg-card rounded-xl p-5 border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{tokenLabel}</p>
            <p className="text-xs text-muted-foreground">Authenticated via token · Session active</p>
          </div>
          <div className="ml-auto">
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full font-medium">Online</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map(s => (
            <div key={s.label} className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <s.icon size={16} className={s.color} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="bg-card rounded-xl p-5 border border-border space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Activity size={18} className="text-primary" /> Recent Activity
          </h2>
          {recentLogins.length === 0 ? (
            <p className="text-muted-foreground text-sm">No login activity yet.</p>
          ) : (
            <div className="space-y-2">
              {recentLogins.map((log, i) => (
                <div key={i} className="flex items-center justify-between bg-secondary rounded-lg px-4 py-3 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm text-foreground font-medium">{log.tokenLabel}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatTime(log.timestamp)}</span>
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
