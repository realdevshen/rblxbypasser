import { useEffect, useState } from "react";
import { Moon, Sparkles } from "lucide-react";

type Theme = "midnight" | "void";
const KEY = "app-theme";

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("theme-void", theme === "void");
}

export function initTheme() {
  const t = (localStorage.getItem(KEY) as Theme) || "midnight";
  apply(t);
}

const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>(
    () => (typeof window !== "undefined" && (localStorage.getItem(KEY) as Theme)) || "midnight"
  );

  useEffect(() => {
    apply(theme);
    localStorage.setItem(KEY, theme);
  }, [theme]);

  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-secondary/60 border border-border/50">
      <button
        onClick={() => setTheme("midnight")}
        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
          theme === "midnight"
            ? "bg-primary/20 text-primary glow-border"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Moon size={12} /> Midnight
      </button>
      <button
        onClick={() => setTheme("void")}
        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
          theme === "void"
            ? "bg-primary/20 text-primary glow-border"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Sparkles size={12} /> Void
      </button>
    </div>
  );
};

export default ThemeToggle;