import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full bg-gradient-brand font-display text-lg font-extrabold text-primary-foreground shadow-brand",
        className,
      )}
      aria-hidden
    >
      F
    </div>
  );
}

export function Logo({ subtitle = "Pegadaian Kanwil" }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-3">
      <LogoMark />
      <div className="leading-tight">
        <div className="font-display text-base font-extrabold tracking-tight text-foreground">
          FormKanwil
        </div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>
    </div>
  );
}
