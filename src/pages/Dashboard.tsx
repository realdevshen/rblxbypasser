import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, LogOut, ArrowLeft, Key, Clock, Activity, User, Zap } from "lucide-react";
import { getTokens, isTokenExpired } from "@/lib/tokenStore";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, used: 0, expired: 0, active: 0 });
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
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem("authenticated");
    sessionStorage.removeItem("token_label");
    navigate("/");
  };

  const statCards = [
    { label: "Total", value: stats.total, icon: Key, className: "text-primary" },
    { label: "Active", value: stats.active, icon: ShieldCheck, className: "text-[hsl(var(--success))]" },
    { label: "Used", value: stats.used, icon: Activity, className: "text-[hsl(var(--warning))]" },
    { label: "Expired", value: stats.expired, icon: Clock, className: "text-destructive" },
  ];

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-lg mx-auto space-y-5 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          </div>
          <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground transition-colors p-2">
            <LogOut size={18} />
          </button>
        </div>

        {/* User Info */}
        <div className="card-glow rounded-2xl p-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-foreground text-sm">{tokenLabel}</p>
            <p className="text-[11px] text-muted-foreground">Authenticated · Session active</p>
          </div>
          <span className="status-online text-[10px] px-2.5 py-1 rounded-full font-medium">Online</span>
        </div>

        {/* Bypass Button */}
        <button
          onClick={() => navigate("/bypass")}
          className="w-full shimmer text-primary-foreground font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2.5 glow-btn transition-all duration-300"
        >
          <Zap size={18} /> Open Bypasser
        </button>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2">
          {statCards.map(s => (
            <div key={s.label} className="card-glow rounded-xl p-3 text-center">
              <s.icon size={16} className={`${s.className} mx-auto mb-1`} />
              <p className="text-lg font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
