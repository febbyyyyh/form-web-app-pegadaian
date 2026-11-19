import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router";

import { AppHeader } from "@/components/fk/AppHeader";
import { FullPageSpinner } from "@/components/fk/States";
import { getCurrentUser, useCurrentUser } from "@/lib/formkanwil/store";

export const Route = createFileRoute("/app")({
  // Session lives in browser storage, so this area renders on the client only.
  ssr: false,
  beforeLoad: () => {
    const user = getCurrentUser();
    if (!user) throw redirect({ to: "/" });
    if (user.role === "admin") throw redirect({ to: "/admin" });
  },
  pendingComponent: FullPageSpinner,
  component: UserLayout,
});

function UserLayout() {
  const user = useCurrentUser();
  const { pathname } = useLocation();
  if (!user) return <FullPageSpinner />;
  return (
    <div className="min-h-screen bg-gradient-page">
      <AppHeader user={user} homeTo="/app" subtitle="Pegadaian Kanwil" />
      <main key={pathname} className="mx-auto max-w-3xl animate-page-in px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
}
