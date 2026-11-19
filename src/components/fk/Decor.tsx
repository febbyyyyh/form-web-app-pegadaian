import { Sparkle } from "lucide-react";

import { cn } from "@/lib/utils";

const COLORS = ["bg-primary", "bg-mint", "bg-gold", "bg-navy", "bg-primary-glow"];
const SHAPES = ["rounded-full", "rounded-sm", "rounded-[2px]"];

/** Deterministic pseudo-random so server and client render identical confetti. */
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export function Confetti({
  count = 28,
  falling = false,
  className,
}: {
  count?: number;
  falling?: boolean;
  className?: string;
}) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {Array.from({ length: count }, (_, i) => {
        const size = 6 + Math.round(rand(i + 1) * 8);
        const isStrip = i % 3 === 1;
        const style = {
          left: `${Math.round(rand(i + 11) * 100)}%`,
          top: falling ? "-5%" : `${Math.round(rand(i + 23) * 100)}%`,
          width: isStrip ? size * 0.5 : size,
          height: isStrip ? size * 1.6 : size,
          transform: `rotate(${Math.round(rand(i + 37) * 180)}deg)`,
          ["--delay" as string]: `${(rand(i + 5) * 4).toFixed(2)}s`,
          ["--duration" as string]: `${(3.5 + rand(i + 7) * 3).toFixed(2)}s`,
          ["--drift" as string]: `${Math.round((rand(i + 9) - 0.5) * 160)}px`,
        };
        return (
          <span
            key={i}
            style={style}
            className={cn(
              "absolute opacity-80",
              COLORS[i % COLORS.length],
              SHAPES[i % SHAPES.length],
              falling ? "animate-confetti-fall" : i % 2 === 0 ? "animate-float-soft" : "",
            )}
          />
        );
      })}
    </div>
  );
}

export function Blobs({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute -left-24 -top-24 size-80 rounded-full bg-mint/60 blur-3xl" />
      <div className="absolute -right-16 top-32 size-72 rounded-full bg-primary-glow/25 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 size-72 rounded-full bg-gold/20 blur-3xl" />
      <Sparkle className="absolute left-[12%] top-[18%] size-5 animate-float-soft text-gold" />
      <Sparkle className="absolute right-[14%] top-[12%] size-4 animate-float-soft text-primary [animation-delay:1.2s]" />
      <Sparkle className="absolute bottom-[16%] right-[22%] size-6 animate-float-soft text-primary-glow [animation-delay:2s]" />
    </div>
  );
}
