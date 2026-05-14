import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import ShieldIcon from "@/components/ShieldIcon";
import { toast } from "sonner";

const ADMIN_PASSWORD = "admin123";

const AdminLogin = () => {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("admin", "true");
      toast.success("Welcome, Admin");
      navigate("/admin");
    } else {
      toast.error("Wrong password");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm space-y-8 relative z-10 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center glow-border">
            <Lock size={18} className="text-primary" />
          </div>
        </div>

        <div className="card-glow rounded-2xl p-6 space-y-5">
          <div className="text-left space-y-2">
            <label className="text-sm font-semibold text-foreground">Password</label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="Enter admin password"
                className="input-field pr-10"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleLogin}
            className="w-full shimmer text-primary-foreground font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2.5 glow-btn transition-all duration-300"
          >
            <Lock size={18} />
            Enter Admin Panel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
