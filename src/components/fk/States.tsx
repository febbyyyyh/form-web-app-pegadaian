import type { ReactNode } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-5 animate-spin text-primary", className)} aria-label="Memuat" />;
}

export function EmptyState({
  emoji,
  title,
  description,
  action,
  className,
}: {
  emoji: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border-2 border-dashed border-mint bg-card/60 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="text-4xl" aria-hidden>
        {emoji}
      </div>
      <div className="mt-3 font-display text-lg font-bold text-foreground">{title}</div>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorNote({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive-soft px-4 py-3 text-sm font-medium text-destructive-foreground animate-page-in",
        className,
      )}
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function InfoNote({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-mint bg-mint-soft px-4 py-3 text-sm text-mint-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FullPageSpinner() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <Spinner className="size-8" />
    </div>
  );
}
