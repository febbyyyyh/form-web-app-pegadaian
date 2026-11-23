import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { EmptyState } from "@/components/fk/States";
import { PageTitle } from "@/components/fk/StatCard";
import { Badge } from "@/components/ui/badge";
import { useDb } from "@/lib/formkanwil/store";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [{ title: "Akun Admin — FormKanwil" }],
  }),
  component: AdminAccountPage,
});

function AdminAccountPage() {
  const db = useDb();
  const admin = db.users.find((user) => user.role === "admin");

  return (
    <div className="space-y-6">
      <PageTitle title="Akun Admin" subtitle="FormKanwil hanya memiliki satu akun administrator." />

      {admin ? (
        <section className="card-soft p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-mint-soft text-primary">
              <ShieldCheck className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-lg font-bold">{admin.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Administrator tunggal · @{admin.username}
              </p>
            </div>
            <Badge variant={admin.active ? "default" : "secondary"}>
              {admin.active ? "Aktif" : "Nonaktif"}
            </Badge>
          </div>
          <dl className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Username
              </dt>
              <dd className="mt-1 font-mono text-sm">@{admin.username}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Email
              </dt>
              <dd className="mt-1 break-all text-sm">{admin.email}</dd>
            </div>
          </dl>
        </section>
      ) : (
        <EmptyState
          emoji="🔐"
          title="Akun admin tidak ditemukan"
          description="Muat ulang aplikasi untuk memulihkan data awal."
        />
      )}
    </div>
  );
}
