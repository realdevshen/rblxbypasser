import { ShieldCheck } from "lucide-react";

interface ShieldIconProps {
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { outer: "w-16 h-16", inner: "w-8 h-8", ring: "w-20 h-20" },
  md: { outer: "w-24 h-24", inner: "w-12 h-12", ring: "w-28 h-28" },
  lg: { outer: "w-28 h-28", inner: "w-14 h-14", ring: "w-32 h-32" },
};

const ShieldIcon = ({ size = "lg" }: ShieldIconProps) => {
  const s = sizes[size];

  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        {/* Outer rotating ring */}
        <div className={`absolute inset-0 ${s.ring} rounded-full border border-primary/20 animate-spin-slow m-auto left-0 right-0 top-0 bottom-0`} />
        {/* Glow circle */}
        <div className={`relative ${s.outer} rounded-full border-2 border-primary/50 flex items-center justify-center glow-border`}>
          {/* Inner gradient bg */}
          <div className="absolute inset-1 rounded-full bg-gradient-to-b from-primary/20 to-transparent" />
          <ShieldCheck className={`${s.inner} text-primary glow-icon relative z-10`} />
        </div>
      </div>
    </div>
  );
};

export default ShieldIcon;
