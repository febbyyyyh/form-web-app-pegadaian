import { createFileRoute, Link, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { FileText, LayoutDashboard, ShieldCheck } from "lucide-react";

import { AppHeader } from "@/components/fk/AppHeader";
import { FullPageSpinner } from "@/components/fk/States";
import { getCurrentUser, useCurrentUser } from "@/lib/formkanwil/store";

export const Route = createFileRoute("/admin")({
  // Session lives in browser storage, so this area renders on the client only.
  ssr: false,
  beforeLoad: () => {
    const user = getCurrentUser();
    if (!user) throw redirect({ to: "/" });
    if (user.role !== "admin") throw redirect({ to: "/app" });
  },
  pendingComponent: FullPageSpinner,
  component: AdminLayout,
});

const navClass =
  "inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-mint-soft hover:text-mint-foreground data-[status=active]:bg-mint-soft data-[status=active]:text-mint-foreground";

function AdminLayout() {
  const user = useCurrentUser();
  const { pathname } = useLocation();
  if (!user || user.role !== "admin") return <FullPageSpinner />;

  const nav = (
    <>
      <Link to="/admin" activeOptions={{ exact: true }} className={navClass}>
        <LayoutDashboard className="size-4" /> Dashboard
      </Link>
      <Link to="/admin/forms" className={navClass}>
        <FileText className="size-4" /> Kelola Form
      </Link>
      <Link to="/admin/users" className={navClass}>
        <ShieldCheck className="size-4" /> Akun Admin
      </Link>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-page">
      <AppHeader user={user} homeTo="/admin" nav={nav} />
      <main key={pathname} className="mx-auto max-w-6xl animate-page-in px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
}
