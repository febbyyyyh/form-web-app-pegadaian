import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const TONES = {
  green: "bg-mint-soft text-mint-foreground",
  gold: "bg-gold-soft text-gold-foreground",
  violet: "bg-violet/15 text-navy",
  navy: "bg-navy text-primary-foreground",
} as const;

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "green",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  tone?: keyof typeof TONES;
}) {
  return (
    <div className="card-soft card-hover p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className={cn("grid size-9 place-items-center rounded-xl", TONES[tone])}>
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function PageTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
