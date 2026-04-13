import { useNavigate } from "react-router-dom";
import { Key, Shield, Zap } from "lucide-react";
import ShieldIcon from "@/components/ShieldIcon";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm space-y-8 text-center relative z-10 animate-fade-in-up">
        <ShieldIcon size="lg" />

        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight text-foreground glow-text">
            Roblox Bypasser
          </h1>
          <p className="text-muted-foreground text-sm">
            Secure automation with real-time bypassing
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate("/login")}
            className="w-full shimmer text-primary-foreground font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2.5 glow-btn transition-all duration-300"
          >
            <Zap size={18} /> Token Login
          </button>
          <button
            onClick={() => navigate("/admin-login")}
            className="w-full bg-card text-secondary-foreground font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2.5 border border-border hover:border-primary/30 hover:bg-card/80 transition-all duration-300"
          >
            <Shield size={18} /> Admin Panel
          </button>
        </div>

        <p className="text-xs text-muted-foreground tracking-wider">
          Secure · Automated · Real-time Bypassing
        </p>
      </div>
    </div>
  );
};

export default Index;
