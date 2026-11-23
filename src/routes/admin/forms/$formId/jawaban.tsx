import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ArrowLeft,
  ChevronDown,
  Download,
  Eye,
  FileText,
  Pencil,
  Star,
  Users,
  X,
} from "lucide-react";
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { EmptyState } from "@/components/fk/States";
import { StatCard } from "@/components/fk/StatCard";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatAnswer,
  getRespondentEmail,
  getRespondentName,
  responsesToCsv,
  responsesToRows,
  summarizeQuestion,
  RATING_MAX,
} from "@/lib/formkanwil/logic";
import { useDb } from "@/lib/formkanwil/store";
import { QUESTION_TYPE_LABEL, type FormResponse } from "@/lib/formkanwil/types";

export const Route = createFileRoute("/admin/forms/$formId/jawaban")({
  head: () => ({
    meta: [
      { title: "Jawaban & Statistik — FormKanwil" },
      {
        name: "description",
        content: "Rekap jawaban, statistik per pertanyaan, pratinjau CSV, dan ekspor CSV atau PDF.",
      },
      { property: "og:title", content: "Jawaban & Statistik — FormKanwil" },
      { property: "og:description", content: "Rekap jawaban dan ekspor CSV atau PDF." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResponsesPage,
});

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];
const barConfig = { count: { label: "Jawaban", color: "var(--chart-1)" } } satisfies ChartConfig;

function ResponsesPage() {
  const { formId } = Route.useParams();
  const db = useDb();
  const form = db.forms.find((f) => f.id === formId);
  const [selected, setSelected] = useState<FormResponse | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const responses = useMemo(() => {
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;
    return db.responses
      .filter((response) => {
        if (response.formId !== formId) return false;
        const submittedAt = new Date(response.submittedAt);
        if (from && submittedAt < from) return false;
        if (to && submittedAt > to) return false;
        return true;
      })
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }, [db.responses, formId, dateFrom, dateTo]);
  const exportRows = useMemo(
    () => (form ? responsesToRows(form, responses, db.users) : []),
    [form, responses, db.users],
  );
  const invalidDateRange = Boolean(dateFrom && dateTo && dateFrom > dateTo);

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

  const ratingQ = form.questions.find((q) => q.type === "rating");
  const ratingSummary = ratingQ ? summarizeQuestion(ratingQ, responses) : null;

  function exportCsv() {
    const csv = responsesToCsv(form, responses, db.users);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.code}-jawaban-${format(new Date(), "yyyyMMdd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${responses.length} jawaban diekspor 📥`);
  }

  async function exportPdf() {
    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const [header = [], ...rows] = exportRows;
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFontSize(14);
      const titleLines = doc.splitTextToSize(form.title, pageWidth - 60);
      doc.text(titleLines, 30, 30);
      doc.setFontSize(9);
      const subtitleY = 30 + titleLines.length * 17;
      doc.text(
        `Kode: ${form.code} - ${responses.length} jawaban - diekspor ${format(new Date(), "d MMMM yyyy HH:mm", { locale: localeId })}`,
        30,
        subtitleY,
      );
      autoTable(doc, {
        head: [header],
        body: rows,
        startY: subtitleY + 12,
        margin: 30,
        styles: { fontSize: 7, cellPadding: 3, overflow: "linebreak" },
        headStyles: { fillColor: [14, 159, 110] },
      });
      doc.save(`${form.code}-jawaban-${format(new Date(), "yyyyMMdd")}.pdf`);
      toast.success(`${responses.length} jawaban diekspor 📥`);
    } catch (error) {
      console.error("Gagal mengekspor jawaban ke PDF.", error);
      toast.error("PDF gagal dibuat. Coba lagi.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link to="/admin/forms">
            <ArrowLeft /> Semua form
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="brandOutline" size="sm">
            <Link to="/admin/forms/$formId" params={{ formId: form.id }}>
              <Pencil /> Edit form
            </Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPreviewOpen(true)}
            disabled={responses.length === 0}
          >
            <Eye /> Preview CSV
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" disabled={responses.length === 0}>
                <Download /> Unduh data <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={exportCsv}>
                <FileText /> Unduh CSV
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void exportPdf()}>
                <FileText /> Unduh PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <section className="card-soft flex flex-wrap items-center gap-4 p-6">
        <div className="grid size-14 place-items-center rounded-2xl bg-mint-soft text-3xl">
          {form.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
            {form.title}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="chip font-mono">Kode: {form.code}</span>
            <span className="chip">
              {form.active ? "🟢 Aktif" : form.status === "closed" ? "⚫ Ditutup" : "⚪ Draft"}
            </span>
          </div>
        </div>
      </section>

      <section className="card-soft grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="space-y-1.5">
          <label htmlFor="response-date-from" className="text-sm font-medium">
            Dari tanggal
          </label>
          <Input
            id="response-date-from"
            type="date"
            value={dateFrom}
            onChange={(event) => {
              setDateFrom(event.target.value);
              setSelected(null);
            }}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="response-date-to" className="text-sm font-medium">
            Sampai tanggal
          </label>
          <Input
            id="response-date-to"
            type="date"
            value={dateTo}
            onChange={(event) => {
              setDateTo(event.target.value);
              setSelected(null);
            }}
          />
        </div>
        {(dateFrom || dateTo) && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDateFrom("");
              setDateTo("");
              setSelected(null);
            }}
          >
            <X /> Hapus filter
          </Button>
        )}
        {invalidDateRange && (
          <p role="alert" className="text-sm text-destructive-foreground sm:col-span-3">
            Tanggal awal tidak boleh melewati tanggal akhir.
          </p>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard icon={Users} label="Jawaban masuk" value={responses.length} />
        <StatCard
          icon={Star}
          label="Rata-rata rating"
          value={
            ratingSummary && ratingSummary.kind === "rating" && ratingSummary.total
              ? `${ratingSummary.average.toFixed(1)} / ${RATING_MAX}`
              : "—"
          }
          tone="gold"
          hint={ratingQ ? ratingQ.label : "Tidak ada pertanyaan rating"}
        />
      </div>

      {responses.length === 0 ? (
        <EmptyState
          emoji="📭"
          title={dateFrom || dateTo ? "Tidak ada jawaban pada rentang ini" : "Belum ada jawaban"}
          description={
            dateFrom || dateTo
              ? "Coba ubah rentang tanggal, atau hapus filternya."
              : "Aktifkan form lalu bagikan tautan kepada responden."
          }
        />
      ) : (
        <Tabs defaultValue="ringkasan">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList className="h-auto rounded-full bg-card p-1 shadow-card">
              <TabsTrigger
                value="ringkasan"
                className="rounded-full px-4 py-1.5 data-[state=active]:bg-mint-soft data-[state=active]:text-mint-foreground"
              >
                Ringkasan
              </TabsTrigger>
              <TabsTrigger
                value="semua"
                className="rounded-full px-4 py-1.5 data-[state=active]:bg-mint-soft data-[state=active]:text-mint-foreground"
              >
                Semua jawaban
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="ringkasan" className="mt-5 space-y-4">
            {form.questions.map((q, i) => {
              const s = summarizeQuestion(q, responses);
              return (
                <section key={q.id} className="card-soft p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-display font-bold">
                      {i + 1}. {q.label}
                    </h3>
                    <span className="chip">
                      {QUESTION_TYPE_LABEL[q.type]} · {s.total} jawaban
                    </span>
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
                          <Star className="size-4 fill-gold text-gold" /> Rata-rata{" "}
                          {s.average.toFixed(1)}
                        </div>
                      )}
                      <ChartContainer
                        config={barConfig}
                        className="mt-3 w-full"
                        style={{ height: Math.max(120, s.counts.length * 40) }}
                      >
                        <BarChart data={s.counts} layout="vertical" margin={{ left: 0, right: 24 }}>
                          <XAxis type="number" hide allowDecimals={false} />
                          <YAxis
                            type="category"
                            dataKey="option"
                            tickLine={false}
                            axisLine={false}
                            width={150}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar
                            dataKey="count"
                            radius={8}
                            label={{
                              position: "right",
                              fill: "var(--muted-foreground)",
                              fontSize: 12,
                            }}
                          >
                            {s.counts.map((_, k) => (
                              <Cell
                                key={k}
                                fill={s.kind === "rating" ? "var(--chart-3)" : PALETTE[k % 4]}
                              />
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
            {responses.length === 0 ? (
              <EmptyState emoji="🙈" title="Tidak ada jawaban" />
            ) : (
              <div className="card-soft overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-mint-soft/60 hover:bg-mint-soft/60">
                      <TableHead>ID jawaban</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead className="hidden sm:table-cell">Email</TableHead>
                      <TableHead>Waktu</TableHead>
                      <TableHead className="hidden md:table-cell">
                        {form.questions[0]?.label}
                      </TableHead>
                      <TableHead className="text-right">Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responses.map((r) => {
                      return (
                        <TableRow
                          key={r.id}
                          className="cursor-pointer hover:bg-mint-soft/40"
                          onClick={() => setSelected(r)}
                        >
                          <TableCell
                            className="whitespace-nowrap font-mono text-xs text-muted-foreground"
                            title={r.id}
                          >
                            {r.id}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {getRespondentName(r, db.users)}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {getRespondentEmail(r, db.users) || "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(r.submittedAt), "d MMM, HH:mm", { locale: localeId })}
                          </TableCell>
                          <TableCell className="hidden max-w-[240px] truncate md:table-cell">
                            {form.questions[0]
                              ? formatAnswer(form.questions[0], r.answers[form.questions[0].id])
                              : ""}
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
                <DialogTitle className="font-display text-xl">
                  {getRespondentName(selected, db.users)}
                </DialogTitle>
                <p className="font-mono text-xs text-muted-foreground">{selected.id}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selected.submittedAt), "d MMMM yyyy, HH:mm", {
                    locale: localeId,
                  })}
                </p>
                <p className="break-all text-sm text-muted-foreground">
                  Email: {getRespondentEmail(selected, db.users) || "Tidak tersedia (data lama)"}
                </p>
              </DialogHeader>
              <dl className="space-y-3">
                {form.questions.map((q, i) => (
                  <div key={q.id} className="rounded-xl bg-muted p-3">
                    <dt className="text-xs font-semibold text-muted-foreground">
                      {i + 1}. {q.label}
                    </dt>
                    <dd className="mt-1 text-sm font-medium">
                      {formatAnswer(q, selected.answers[q.id]) || (
                        <span className="italic text-muted-foreground">Tidak dijawab</span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Preview data CSV</DialogTitle>
            <DialogDescription>
              Data yang sama akan digunakan saat mengunduh CSV atau PDF, termasuk filter tanggal
              yang sedang dipilih.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Menampilkan {Math.min(responses.length, 20)} dari {responses.length} jawaban.
          </p>
          <div className="max-h-[60vh] overflow-auto rounded-xl border">
            <Table className="min-w-max">
              <TableHeader>
                <TableRow className="bg-mint-soft/60 hover:bg-mint-soft/60">
                  {(exportRows[0] ?? []).map((heading, index) => (
                    <TableHead key={`${heading}-${index}`} className="whitespace-nowrap">
                      {heading}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {exportRows.slice(1, 21).map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((value, columnIndex) => (
                      <TableCell
                        key={`${rowIndex}-${columnIndex}`}
                        className="max-w-xs whitespace-pre-wrap align-top"
                      >
                        {value || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
