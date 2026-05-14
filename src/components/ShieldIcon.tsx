import { ShieldCheck } from "lucide-react";

interface ShieldIconProps {
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { outer: "w-20 h-20", inner: "w-9 h-9", ring1: "w-24 h-24", ring2: "w-28 h-28" },
  md: { outer: "w-28 h-28", inner: "w-12 h-12", ring1: "w-32 h-32", ring2: "w-36 h-36" },
  lg: { outer: "w-32 h-32", inner: "w-16 h-16", ring1: "w-36 h-36", ring2: "w-44 h-44" },
};

const ShieldIcon = ({ size = "lg" }: ShieldIconProps) => {
  const s = sizes[size];

  return (
    <div className="flex items-center justify-center">
      <div className="relative flex items-center justify-center">
        {/* Ambient pulse glow */}
        <div className={`absolute ${s.ring2} rounded-full bg-primary/10 blur-2xl animate-pulse-glow`} />

        {/* Outer dashed rotating ring */}
        <div
          className={`absolute ${s.ring2} rounded-full border border-dashed border-primary/30 animate-spin-slow`}
          style={{ animationDuration: "18s" }}
        />

        {/* Inner counter-rotating ring */}
        <div
          className={`absolute ${s.ring1} rounded-full border border-primary/40 animate-spin-slow`}
          style={{ animationDuration: "9s", animationDirection: "reverse" }}
        />

        {/* Orbiting dots */}
        <div className={`absolute ${s.ring1} animate-spin-slow`} style={{ animationDuration: "12s" }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary/70" />
        </div>

        {/* Core shield */}
        <div
          className={`relative ${s.outer} rounded-full flex items-center justify-center glow-border border-2 border-primary/60`}
          style={{
            background:
              "radial-gradient(circle at 30% 20%, hsl(var(--primary) / 0.35), hsl(var(--background)) 70%)",
            boxShadow:
              "0 0 40px hsl(var(--primary) / 0.4), inset 0 0 20px hsl(var(--primary) / 0.2)",
          }}
        >
          <ShieldCheck className={`${s.inner} text-primary glow-icon relative z-10`} strokeWidth={2.2} />
        </div>
      </div>
    </div>
  );
};

export default ShieldIcon;
