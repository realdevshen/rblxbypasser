import { useNavigate } from "react-router-dom";
import { Key, Shield } from "lucide-react";
import ShieldIcon from "@/components/ShieldIcon";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <ShieldIcon />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Token Auth</h1>
          <p className="mt-2 text-muted-foreground text-sm">Secure token-based access system</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate("/login")}
            className="w-full shimmer text-primary-foreground font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Key size={18} /> Token Login
          </button>
          <button
            onClick={() => navigate("/admin-login")}
            className="w-full bg-secondary text-secondary-foreground font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors border border-border"
          >
            <Shield size={18} /> Admin Panel
          </button>
        </div>

        <p className="text-xs text-muted-foreground">Secure · Token-Based · Real-Time</p>
      </div>
    </div>
  );
};

export default Index;
