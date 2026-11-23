import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { setSession } from "@/lib/formkanwil/store";
import type { User } from "@/lib/formkanwil/types";
import { Logo } from "./Logo";

export function AppHeader({
  user,
  homeTo,
  nav,
}: {
  user: User;
  homeTo: "/app" | "/admin";
  nav?: ReactNode;
}) {
  const navigate = useNavigate();
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          to={homeTo}
          className="rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
        >
          <Logo />
        </Link>
        {nav && <nav className="hidden items-center gap-1 md:flex">{nav}</nav>}
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-sm font-semibold text-foreground">{user.name}</div>
            <div className="text-xs text-muted-foreground">
              {user.role === "admin" ? "Admin" : "Pengguna"}
            </div>
          </div>
          <div className="grid size-9 place-items-center rounded-full bg-mint-soft text-xs font-bold text-mint-foreground">
            {initials}
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="brandOutline" size="sm" aria-label="Keluar">
                <LogOut />
                <span className="hidden sm:inline">Keluar</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Keluar dari akun?</AlertDialogTitle>
                <AlertDialogDescription>
                  Kamu akan kembali ke halaman masuk. Yakin ingin keluar?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setSession(null);
                    navigate({ to: "/", replace: true });
                  }}
                >
                  Ya, keluar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      {nav && (
        <nav className="flex gap-1 overflow-x-auto border-t border-border px-4 py-2 md:hidden">
          {nav}
        </nav>
      )}
    </header>
  );
}
