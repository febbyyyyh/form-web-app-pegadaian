import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ArrowLeft, Download, Pencil, Percent, Star, Users } from "lucide-react";
import { Bar, BarChart, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { EmptyState } from "@/components/fk/States";
import { StatCard } from "@/components/fk/StatCard";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatAnswer, responsesToCsv, summarizeQuestion, RATING_MAX } from "@/lib/formkanwil/logic";
import { useDb } from "@/lib/formkanwil/store";
import { QUESTION_TYPE_LABEL, type FormResponse } from "@/lib/formkanwil/types";

export const Route = createFileRoute("/admin/forms/$formId/jawaban")({
  head: () => ({
    meta: [
      { title: "Jawaban & Statistik — FormKanwil" },
      { name: "description", content: "Rekap jawaban, statistik per pertanyaan, dan ekspor CSV." },
      { property: "og:title", content: "Jawaban & Statistik — FormKanwil" },
      { property: "og:description", content: "Rekap jawaban dan ekspor CSV." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResponsesPage,
});

const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const barConfig = { count: { label: "Jawaban", color: "var(--chart-1)" } } satisfies ChartConfig;

function ResponsesPage() {
  const { formId } = Route.useParams();
  const db = useDb();
  const form = db.forms.find((f) => f.id === formId);
  const [unit, setUnit] = useState("all");
  const [selected, setSelected] = useState<FormResponse | null>(null);

  const responses = useMemo(
    () =>
      db.responses
        .filter((r) => r.formId === formId)
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    [db.responses, formId],
  );
  const userOf = (id: string) => db.users.find((u) => u.id === id);
  const filtered = unit === "all" ? responses : responses.filter((r) => userOf(r.userId)?.unit === unit);

  if (!form) {
    return (
      <EmptyState
        emoji="🔍"
        title="Form tidak ditemukan"
        action={
          <Button asChild>
            <Link to="/admin/forms">Kembali</Link>
          </Button>
        }
      />
    );
  }

  const members = db.users.filter((u) => u.role === "user").length;
  const ratingQ = form.questions.find((q) => q.type === "rating");
  const ratingSummary = ratingQ ? summarizeQuestion(ratingQ, filtered) : null;
  const perUnit = db.units
    .map((u) => ({ unit: u, count: responses.filter((r) => userOf(r.userId)?.unit === u).length }))
    .filter((x) => x.count > 0);

  function exportCsv() {
    if (!form) return;
    const csv = responsesToCsv(form, filtered, db.users);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.code}-jawaban-${format(new Date(), "yyyyMMdd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} jawaban diekspor 📥`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link to="/admin/forms">
            <ArrowLeft /> Semua form
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button asChild variant="brandOutline" size="sm">
            <Link to="/admin/forms/$formId" params={{ formId: form.id }}>
              <Pencil /> Edit form
            </Link>
          </Button>
          <Button size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download /> Export CSV
          </Button>
        </div>
      </div>

      <section className="card-soft flex flex-wrap items-center gap-4 p-6">
        <div className="grid size-14 place-items-center rounded-2xl bg-mint-soft text-3xl">{form.emoji}</div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{form.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="chip font-mono">Kode: {form.code}</span>
            <span className="chip">{form.active ? "🟢 Aktif" : "⚪ Nonaktif"}</span>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label="Jawaban masuk" value={responses.length} hint={unit !== "all" ? `${filtered.length} dari unit ${unit}` : undefined} />
        <StatCard icon={Percent} label="Tingkat partisipasi" value={`${members ? Math.round((responses.length / members) * 100) : 0}%`} tone="violet" hint={`dari ${members} pengguna`} />
        <StatCard
          icon={Star}
          label="Rata-rata rating"
          value={ratingSummary && ratingSummary.kind === "rating" && ratingSummary.total ? `${ratingSummary.average.toFixed(1)} / ${RATING_MAX}` : "—"}
          tone="gold"
          hint={ratingQ ? ratingQ.label : "Tidak ada pertanyaan rating"}
        />
      </div>

      {responses.length === 0 ? (
        <EmptyState emoji="📭" title="Belum ada jawaban" description={`Bagikan kode ${form.code} ke peserta supaya jawaban mulai masuk.`} />
      ) : (
        <Tabs defaultValue="ringkasan">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList className="h-auto rounded-full bg-card p-1 shadow-card">
              <TabsTrigger value="ringkasan" className="rounded-full px-4 py-1.5 data-[state=active]:bg-mint-soft data-[state=active]:text-mint-foreground">
                Ringkasan
              </TabsTrigger>
              <TabsTrigger value="semua" className="rounded-full px-4 py-1.5 data-[state=active]:bg-mint-soft data-[state=active]:text-mint-foreground">
                Semua jawaban
              </TabsTrigger>
            </TabsList>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger className="w-52 bg-card" aria-label="Filter unit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua unit</SelectItem>
                {db.units.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="ringkasan" className="mt-5 space-y-4">
            {unit === "all" && perUnit.length > 0 && (
              <section className="card-soft p-5">
                <h3 className="font-display font-bold">Sebaran per unit</h3>
                <div className="mt-2 flex flex-wrap items-center gap-6">
                  <ChartContainer config={barConfig} className="h-44 w-44">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent nameKey="unit" hideLabel />} />
                      <Pie data={perUnit} dataKey="count" nameKey="unit" innerRadius={40} outerRadius={70} paddingAngle={3}>
                        {perUnit.map((_, i) => (
                          <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  <ul className="grid gap-1.5 text-sm">
                    {perUnit.map((p, i) => (
                      <li key={p.unit} className="flex items-center gap-2">
                        <span className="size-3 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                        <span className="font-medium">{p.unit}</span>
                        <span className="text-muted-foreground">· {p.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {form.questions.map((q, i) => {
              const s = summarizeQuestion(q, filtered);
              return (
                <section key={q.id} className="card-soft p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-display font-bold">
                      {i + 1}. {q.label}
                    </h3>
                    <span className="chip">{QUESTION_TYPE_LABEL[q.type]} · {s.total} jawaban</span>
                  </div>
                  {s.kind === "text" ? (
                    s.samples.length === 0 ? (
                      <p className="mt-3 text-sm text-muted-foreground">Belum ada jawaban 🌱</p>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {s.samples.map((t, k) => (
                          <li key={k} className="rounded-xl bg-muted px-4 py-2.5 text-sm">
                            {t}
                          </li>
                        ))}
                      </ul>
                    )
                  ) : (
                    <>
                      {s.kind === "rating" && s.total > 0 && (
                        <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-gold-foreground">
                          <Star className="size-4 fill-gold text-gold" /> Rata-rata {s.average.toFixed(1)}
                        </div>
                      )}
                      <ChartContainer config={barConfig} className="mt-3 w-full" style={{ height: Math.max(120, s.counts.length * 40) }}>
                        <BarChart data={s.counts} layout="vertical" margin={{ left: 0, right: 24 }}>
                          <XAxis type="number" hide allowDecimals={false} />
                          <YAxis type="category" dataKey="option" tickLine={false} axisLine={false} width={150} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="count" radius={8} label={{ position: "right", fill: "var(--muted-foreground)", fontSize: 12 }}>
                            {s.counts.map((_, k) => (
                              <Cell key={k} fill={s.kind === "rating" ? "var(--chart-3)" : PALETTE[k % 4]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ChartContainer>
                    </>
                  )}
                </section>
              );
            })}
          </TabsContent>

          <TabsContent value="semua" className="mt-5">
            {filtered.length === 0 ? (
              <EmptyState emoji="🙈" title="Tidak ada jawaban dari unit ini" />
            ) : (
              <div className="card-soft overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-mint-soft/60 hover:bg-mint-soft/60">
                      <TableHead>Nama</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Waktu</TableHead>
                      <TableHead className="hidden md:table-cell">{form.questions[0]?.label}</TableHead>
                      <TableHead className="text-right">Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => {
                      const u = userOf(r.userId);
                      return (
                        <TableRow key={r.id} className="cursor-pointer hover:bg-mint-soft/40" onClick={() => setSelected(r)}>
                          <TableCell className="font-semibold">{u?.name ?? "(akun dihapus)"}</TableCell>
                          <TableCell>
                            <span className="chip">{u?.unit ?? "-"}</span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(r.submittedAt), "d MMM, HH:mm", { locale: localeId })}
                          </TableCell>
                          <TableCell className="hidden max-w-[240px] truncate md:table-cell">
                            {form.questions[0] ? formatAnswer(form.questions[0], r.answers[form.questions[0].id]) : ""}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              Lihat
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl">{userOf(selected.userId)?.name ?? "Jawaban"}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {userOf(selected.userId)?.unit} ·{" "}
                  {format(new Date(selected.submittedAt), "d MMMM yyyy, HH:mm", { locale: localeId })}
                </p>
              </DialogHeader>
              <dl className="space-y-3">
                {form.questions.map((q, i) => (
                  <div key={q.id} className="rounded-xl bg-muted p-3">
                    <dt className="text-xs font-semibold text-muted-foreground">
                      {i + 1}. {q.label}
                    </dt>
                    <dd className="mt-1 text-sm font-medium">
                      {formatAnswer(q, selected.answers[q.id]) || <span className="italic text-muted-foreground">Tidak dijawab</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
