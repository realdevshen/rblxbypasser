import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, LogOut } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem("authenticated") !== "true") {
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem("authenticated");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-6">
        <ShieldCheck className="w-16 h-16 text-primary mx-auto glow-icon" />
        <h1 className="text-3xl font-bold text-foreground">Access Granted</h1>
        <p className="text-muted-foreground">You have successfully authenticated with your token.</p>
        <button
          onClick={handleLogout}
          className="bg-secondary text-secondary-foreground px-6 py-3 rounded-lg font-medium flex items-center gap-2 mx-auto hover:bg-secondary/80 transition-colors"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
