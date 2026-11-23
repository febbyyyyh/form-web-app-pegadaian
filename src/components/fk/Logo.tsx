import { cn } from "@/lib/utils";
import pegadaianLogo from "@/assets/logo-pegadaian.svg";

export function PegadaianLogo({ className }: { className?: string }) {
  return (
    <img
      src={pegadaianLogo}
      alt="Pegadaian"
      className={cn("h-10 w-auto shrink-0 object-contain", className)}
    />
  );
}

export function Logo() {
  return <PegadaianLogo />;
}
