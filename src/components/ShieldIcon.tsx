import { ShieldCheck } from "lucide-react";

const ShieldIcon = () => (
  <div className="flex items-center justify-center">
    <div className="relative w-24 h-24 rounded-full border-2 border-primary/40 flex items-center justify-center glow-border">
      <ShieldCheck className="w-12 h-12 text-primary glow-icon" />
    </div>
  </div>
);

export default ShieldIcon;
