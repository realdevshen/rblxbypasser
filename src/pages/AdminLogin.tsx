import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ArrowRight } from "lucide-react";
import ShieldIcon from "@/components/ShieldIcon";
import { toast } from "sonner";

const ADMIN_PASSWORD = "admin123"; // For demo only — never do this in production

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
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <ShieldIcon />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Access</h1>
          <p className="mt-2 text-muted-foreground text-sm">Enter the admin password</p>
        </div>

        <div className="bg-card rounded-xl p-6 space-y-5 border border-border">
          <div className="text-left space-y-2">
            <label className="text-sm font-medium text-foreground">Password</label>
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="Enter admin password"
              className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <button
            onClick={handleLogin}
            className="w-full shimmer text-primary-foreground font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
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
