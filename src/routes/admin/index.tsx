import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format, startOfDay, subDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ArrowRight, FileCheck2, FileText, MessageSquareText, Plus, Users } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { EmptyState } from "@/components/fk/States";
import { PageTitle, StatCard } from "@/components/fk/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { useCurrentUser, useDb } from "@/lib/formkanwil/store";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard Admin — FormKanwil" },
      { name: "description", content: "Ringkasan form, jawaban, dan partisipasi unit di FormKanwil." },
      { property: "og:title", content: "Dashboard Admin — FormKanwil" },
      { property: "og:description", content: "Ringkasan form, jawaban, dan partisipasi unit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminDashboard,
});

const trendConfig = { jawaban: { label: "Jawaban", color: "var(--chart-1)" } } satisfies ChartConfig;
const unitConfig = { jawaban: { label: "Jawaban", color: "var(--chart-2)" } } satisfies ChartConfig;

function AdminDashboard() {
  const db = useDb();
  const admin = useCurrentUser()!;

  const stats = useMemo(() => {
    const members = db.users.filter((u) => u.role === "user");
    const activeForms = db.forms.filter((f) => f.active);
    const today = startOfDay(new Date());
    const trend = Array.from({ length: 7 }, (_, i) => {
      const day = subDays(today, 6 - i);
      const next = subDays(today, 5 - i);
      return {
        hari: format(day, "EEE", { locale: localeId }),
        jawaban: db.responses.filter((r) => {
          const t = new Date(r.submittedAt);
          return t >= day && t < next;
        }).length,
      };
    });
    const perUnit = db.units.map((unit) => ({
      unit,
      jawaban: db.responses.filter((r) => db.users.find((u) => u.id === r.userId)?.unit === unit).length,
    }));
    const participants = new Set(db.responses.map((r) => r.userId)).size;
    return { members, activeForms, trend, perUnit, participants };
  }, [db]);

  const recentForms = [...db.forms].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4);

  return (
    <div className="space-y-8">
      <PageTitle
        title={`Halo, ${admin.name.split(" ")[0]} 👋`}
        subtitle="Ini ringkasan suara insan Kanwil hari ini."
        action={
          <Button asChild size="lg">
            <Link to="/admin/forms">
              <Plus /> Buat form baru
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FileText} label="Total form" value={db.forms.length} hint={`${stats.activeForms.length} sedang aktif`} />
        <StatCard icon={MessageSquareText} label="Total jawaban" value={db.responses.length} tone="violet" hint="Dari semua form" />
        <StatCard icon={Users} label="Pengguna" value={stats.members.length} tone="gold" hint={`${db.units.length} unit kerja`} />
        <StatCard
          icon={FileCheck2}
          label="Partisipasi"
          value={`${stats.members.length ? Math.round((stats.participants / stats.members.length) * 100) : 0}%`}
          tone="navy"
          hint="User yang pernah mengisi"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <section className="card-soft p-5 lg:col-span-3">
          <h2 className="font-display text-lg font-bold">Jawaban 7 hari terakhir</h2>
          <ChartContainer config={trendConfig} className="mt-4 h-56 w-full">
            <AreaChart data={stats.trend} margin={{ left: -20, right: 8 }}>
              <defs>
                <linearGradient id="fillJawaban" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-jawaban)" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="var(--color-jawaban)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="hari" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="jawaban" stroke="var(--color-jawaban)" strokeWidth={3} fill="url(#fillJawaban)" />
            </AreaChart>
          </ChartContainer>
        </section>
        <section className="card-soft p-5 lg:col-span-2">
          <h2 className="font-display text-lg font-bold">Jawaban per unit</h2>
          <ChartContainer config={unitConfig} className="mt-4 h-56 w-full">
            <BarChart data={stats.perUnit} layout="vertical" margin={{ left: 10, right: 8 }}>
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis type="category" dataKey="unit" tickLine={false} axisLine={false} width={80} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="jawaban" fill="var(--color-jawaban)" radius={8} />
            </BarChart>
          </ChartContainer>
        </section>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-extrabold">Form terbaru</h2>
          <Link to="/admin/forms" className="text-sm font-semibold text-primary hover:underline">
            Lihat semua
          </Link>
        </div>
        {recentForms.length === 0 ? (
          <EmptyState emoji="📝" title="Belum ada form" description="Buat form pertamamu dan bagikan kodenya." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {recentForms.map((f) => {
              const count = db.responses.filter((r) => r.formId === f.id).length;
              return (
                <Link
                  key={f.id}
                  to="/admin/forms/$formId/jawaban"
                  params={{ formId: f.id }}
                  className="card-soft card-hover flex items-center gap-4 p-4"
                >
                  <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-mint-soft text-2xl">{f.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{f.title}</div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">{f.code}</span> · {count} jawaban
                    </div>
                  </div>
                  <Badge variant={f.active ? "default" : "secondary"}>{f.active ? "Aktif" : "Nonaktif"}</Badge>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
