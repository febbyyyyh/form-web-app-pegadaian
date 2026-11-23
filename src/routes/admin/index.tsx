import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format, subDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Area, AreaChart, CartesianGrid, Cell, Label, Pie, PieChart, XAxis, YAxis } from "recharts";
import {
  ArrowRight,
  BarChart3,
  Check,
  Database,
  FileCheck2,
  FileText,
  MessageSquareText,
  Pencil,
} from "lucide-react";

import { EmptyState, FullPageSpinner } from "@/components/fk/States";
import { PageTitle, StatCard } from "@/components/fk/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { getRespondentName } from "@/lib/formkanwil/logic";
import { useCurrentUser, useDb } from "@/lib/formkanwil/store";
import type { Form, FormResponse, Question } from "@/lib/formkanwil/types";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard Admin — FormKanwil" },
      {
        name: "description",
        content: "Ringkasan form dan jawaban di FormKanwil.",
      },
      { property: "og:title", content: "Dashboard Admin — FormKanwil" },
      { property: "og:description", content: "Ringkasan form dan jawaban." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminDashboard,
});

const COLORS = ["#0E9F6E", "#A7F3D0", "#F5C96B", "#F87171", "#0A1D48", "#A78BFA", "#34D399"];
const STATUS_FILTERS = [
  { value: "all", label: "Semua status" },
  { value: "active", label: "Aktif" },
  { value: "draft", label: "Draft" },
  { value: "closed", label: "Ditutup" },
];

function getStatus(form: Form): "draft" | "active" | "closed" {
  return form.active ? "active" : form.status === "closed" ? "closed" : "draft";
}

function statusLabel(status: "draft" | "active" | "closed") {
  return status === "active" ? "Aktif" : status === "draft" ? "Draft" : "Ditutup";
}

function AdminDashboard() {
  const db = useDb();
  const admin = useCurrentUser();
  const [selectedFormId, setSelectedFormId] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredForms = useMemo(
    () => db.forms.filter((form) => statusFilter === "all" || getStatus(form) === statusFilter),
    [db.forms, statusFilter],
  );
  const selectedForm = filteredForms.find((form) => form.id === selectedFormId) ?? null;

  const summary = useMemo(() => {
    return {
      forms: db.forms.length,
      responses: db.responses.length,
      draftForms: db.forms.filter((form) => getStatus(form) === "draft").length,
      activeForms: db.forms.filter((form) => getStatus(form) === "active").length,
    };
  }, [db]);

  const filteredResponses = useMemo(() => {
    if (!selectedForm) return [];
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;
    return db.responses.filter((response) => {
      if (response.formId !== selectedForm.id) return false;
      const submittedAt = new Date(response.submittedAt);
      if (from && submittedAt < from) return false;
      if (to && submittedAt > to) return false;
      return true;
    });
  }, [db.responses, selectedForm, dateFrom, dateTo]);

  const choiceQuestion = selectedForm?.questions.find((question) =>
    ["single", "dropdown"].includes(question.type),
  );
  const choiceData = choiceQuestion
    ? (choiceQuestion.options ?? [])
        .map((option, index) => ({
          name: option,
          jumlah: filteredResponses.filter(
            (response) => response.answers[choiceQuestion.id] === option,
          ).length,
          fill: COLORS[index % COLORS.length],
        }))
        .filter((item) => item.jumlah > 0)
    : [];
  const ratingQuestions =
    selectedForm?.questions.filter((question) => question.type === "rating") ?? [];

  const trendDays = useMemo(() => {
    const end = dateTo ? new Date(`${dateTo}T00:00:00`) : new Date();
    const start = dateFrom ? new Date(`${dateFrom}T00:00:00`) : subDays(end, 14);
    const days = Math.min(
      31,
      Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86_400_000) + 1),
    );
    return Array.from({ length: days }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      const key = format(day, "yyyy-MM-dd");
      return {
        tanggal: format(day, "d MMM", { locale: localeId }),
        jawaban: filteredResponses.filter((response) => response.submittedAt.slice(0, 10) === key)
          .length,
      };
    });
  }, [filteredResponses, dateFrom, dateTo]);

  if (!admin || admin.role !== "admin") return <FullPageSpinner />;

  return (
    <div className="space-y-8">
      <PageTitle
        title={`Halo, ${admin.name.split(" ")[0]} 👋`}
        subtitle="Pantau form dan suara insan Kanwil dalam satu dashboard."
        action={
          <Button asChild size="lg">
            <Link to="/admin/forms">
              <FileText /> Kelola form
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FileText} label="Total Form" value={summary.forms} hint="Form tersimpan" />
        <StatCard
          icon={MessageSquareText}
          label="Total Jawaban"
          value={summary.responses}
          tone="violet"
          hint="Semua jawaban masuk"
        />
        <StatCard
          icon={FileCheck2}
          label="Form Draft"
          value={summary.draftForms}
          tone="gold"
          hint="Belum aktif dibagikan"
        />
        <StatCard
          icon={Database}
          label="Form Aktif"
          value={summary.activeForms}
          tone="navy"
          hint="Siap menerima jawaban"
        />
      </div>

      {db.forms.length === 0 && (
        <section className="card-soft overflow-hidden">
          <div className="grid gap-6 bg-gradient-hero p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
            <div>
              <h2 className="font-display text-2xl font-extrabold">
                Belum ada form. Buat form pertama kamu!
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Dashboard ini akan menampilkan ringkasan setelah form dan jawaban dibuat.
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/admin/forms">
                <FileText /> Buat form pertama
              </Link>
            </Button>
          </div>
        </section>
      )}

      {db.forms.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-extrabold">Form & visualisasi</h2>
              <p className="text-sm text-muted-foreground">
                Pilih form untuk melihat ringkasan jawaban agregat.
              </p>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setSelectedFormId("");
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredForms.length === 0 ? (
            <EmptyState
              emoji="🗂️"
              title="Belum ada form dengan status ini"
              description="Pilih status lain untuk melihat form."
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filteredForms.map((form) => {
                const count = db.responses.filter((response) => response.formId === form.id).length;
                const status = getStatus(form);
                const isSelected = selectedForm?.id === form.id;
                return (
                  <button
                    key={form.id}
                    type="button"
                    onClick={() => setSelectedFormId(form.id)}
                    aria-label={`Pilih form ${form.title} untuk ringkasan`}
                    aria-pressed={isSelected}
                    className={`card-soft card-hover flex cursor-pointer items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 ${isSelected ? "ring-2 ring-primary" : ""}`}
                  >
                    <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-mint-soft text-2xl">
                      {form.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{form.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {count} jawaban · Kode {form.code}
                      </div>
                    </div>
                    <Badge variant={status === "active" ? "default" : "secondary"}>
                      {statusLabel(status)}
                    </Badge>
                    {isSelected ? (
                      <span className="chip shrink-0">
                        <Check className="size-3" /> Dipilih
                      </span>
                    ) : (
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {!selectedForm && filteredForms.length > 0 && (
            <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              Pilih form di atas untuk melihat ringkasan dan jawaban.
            </p>
          )}

          {selectedForm && (
            <div className="space-y-4 pt-2">
              <div className="card-soft flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{selectedForm.emoji}</span>
                    <h3 className="font-display text-lg font-bold">{selectedForm.title}</h3>
                    <Badge variant={getStatus(selectedForm) === "active" ? "default" : "secondary"}>
                      {statusLabel(getStatus(selectedForm))}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedForm.description}</p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <Link
                    to="/admin/forms/$formId"
                    params={{ formId: selectedForm.id }}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                  >
                    <Pencil className="size-4" /> Edit form
                  </Link>
                  <Link
                    to="/admin/forms/$formId/jawaban"
                    params={{ formId: selectedForm.id }}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                  >
                    <BarChart3 className="size-4" /> Lihat semua jawaban
                  </Link>
                </div>
              </div>

              <div className="card-soft grid gap-3 p-4 sm:grid-cols-2">
                <Input
                  aria-label="Tanggal mulai"
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                />
                <Input
                  aria-label="Tanggal akhir"
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                />
              </div>

              <div className="grid gap-4">
                <section className="card-soft p-5">
                  <h3 className="font-display text-lg font-bold">Ringkasan jawaban</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {filteredResponses.length} jawaban diterima pada rentang tanggal yang dipilih.
                  </p>
                  {choiceQuestion && choiceData.length > 0 ? (
                    <>
                      <ChartContainer
                        config={choiceData.reduce<ChartConfig>((config, item) => {
                          config[item.name] = { label: item.name, color: item.fill };
                          return config;
                        }, {})}
                        className="mx-auto mt-3 h-64 max-w-lg"
                      >
                        <PieChart>
                          <Pie
                            data={choiceData}
                            dataKey="jumlah"
                            nameKey="name"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={3}
                            label={({ cx, cy, midAngle, outerRadius, percent }) => {
                              const radians = (-(midAngle ?? 0) * Math.PI) / 180;
                              const radius = (outerRadius ?? 100) + 18;
                              const x = (cx ?? 0) + radius * Math.cos(radians);
                              const y = (cy ?? 0) + radius * Math.sin(radians);
                              return (
                                <text
                                  x={x}
                                  y={y}
                                  textAnchor={x > (cx ?? 0) ? "start" : "end"}
                                  dominantBaseline="central"
                                  className="fill-foreground text-xs font-bold"
                                >{`${Math.round((percent ?? 0) * 100)}%`}</text>
                              );
                            }}
                            labelLine={false}
                          >
                            {choiceData.map((entry) => (
                              <Cell key={entry.name} fill={entry.fill} />
                            ))}
                            <Label
                              position="center"
                              content={({ viewBox }) => {
                                const { cx, cy } = viewBox as { cx: number; cy: number };
                                return (
                                  <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                                    <tspan
                                      x={cx}
                                      dy="-0.25em"
                                      className="fill-foreground text-2xl font-extrabold"
                                    >
                                      {filteredResponses.length}
                                    </tspan>
                                    <tspan
                                      x={cx}
                                      dy="1.7em"
                                      className="fill-muted-foreground text-xs"
                                    >
                                      jawaban
                                    </tspan>
                                  </text>
                                );
                              }}
                            />
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ChartContainer>
                      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
                        {choiceData.map((item) => {
                          const total = choiceData.reduce((sum, value) => sum + value.jumlah, 0);
                          const percent = total ? Math.round((item.jumlah / total) * 100) : 0;
                          return (
                            <span key={item.name} className="inline-flex items-center gap-1.5">
                              <i
                                className="size-2.5 rounded-full"
                                style={{ backgroundColor: item.fill }}
                              />
                              {item.name} {percent}%
                            </span>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <EmptyState
                      className="mt-5"
                      emoji="📊"
                      title="Belum ada distribusi pilihan"
                      description="Distribusi akan muncul setelah peserta mengirim jawaban."
                    />
                  )}
                </section>
              </div>

              {ratingQuestions.length > 0 && (
                <div className="grid gap-4 lg:grid-cols-2">
                  {ratingQuestions.map((question) => (
                    <RatingBreakdown
                      key={question.id}
                      question={question}
                      responses={filteredResponses}
                    />
                  ))}
                </div>
              )}

              <section className="card-soft p-5">
                <h3 className="font-display text-lg font-bold">Jawaban per Hari</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tren pengisian berdasarkan rentang tanggal yang dipilih.
                </p>
                <ChartContainer
                  config={{ jawaban: { label: "Jawaban", color: "var(--chart-1)" } }}
                  className="mt-4 h-64 w-full"
                >
                  <AreaChart data={trendDays} margin={{ left: -20, right: 10 }}>
                    <defs>
                      <linearGradient id="fillDailyResponses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-jawaban)" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="var(--color-jawaban)" stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="tanggal" tickLine={false} axisLine={false} minTickGap={20} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="jawaban"
                      stroke="var(--color-jawaban)"
                      strokeWidth={3}
                      fill="url(#fillDailyResponses)"
                    />
                  </AreaChart>
                </ChartContainer>
              </section>

              <section className="card-soft overflow-hidden">
                <div className="border-b border-border p-5">
                  <h3 className="font-display text-lg font-bold">Tabel jawaban</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {filteredResponses.length} jawaban sesuai filter yang dipilih.
                  </p>
                </div>
                {filteredResponses.length === 0 ? (
                  <EmptyState
                    className="m-4"
                    emoji="📭"
                    title="Belum ada jawaban pada filter ini"
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Waktu</TableHead>
                        {selectedForm.questions.map((question) => (
                          <TableHead key={question.id} className="min-w-48">
                            {question.label}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...filteredResponses]
                        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
                        .map((response) => {
                          return (
                            <TableRow key={response.id}>
                              <TableCell className="whitespace-nowrap font-semibold">
                                {getRespondentName(response, db.users)}
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                {new Date(response.submittedAt).toLocaleString("id-ID")}
                              </TableCell>
                              {selectedForm.questions.map((question) => {
                                const value = response.answers[question.id];
                                return (
                                  <TableCell key={question.id} className="max-w-64 text-xs">
                                    {Array.isArray(value)
                                      ? value.join(", ")
                                      : value === undefined
                                        ? "—"
                                        : String(value)}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                )}
              </section>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function RatingBreakdown({
  question,
  responses,
}: {
  question: Question;
  responses: FormResponse[];
}) {
  const values = responses
    .map((response) => response.answers[question.id])
    .filter(
      (value): value is number | string => typeof value === "number" || typeof value === "string",
    )
    .map(Number)
    .filter((value) => Number.isInteger(value) && value >= 1 && value <= 5);
  const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  const data = Array.from({ length: 5 }, (_, index) => {
    const rating = index + 1;
    const count = values.filter((value) => value === rating).length;
    return {
      rating: `${rating} bintang`,
      persen: values.length ? Math.round((count / values.length) * 100) : 0,
      count,
    };
  });

  return (
    <section className="card-soft p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold">Rating</h3>
          <p className="mt-1 text-sm text-muted-foreground">{question.label}</p>
        </div>
        <div className="rounded-2xl bg-gold-soft px-3 py-2 text-right">
          <div className="font-display text-2xl font-extrabold text-gold-foreground">
            {average.toFixed(1)}/5
          </div>
          <div className="text-[11px] text-muted-foreground">{values.length} penilaian</div>
        </div>
      </div>
      {values.length ? (
        <ChartContainer
          config={{ persen: { label: "Persentase", color: "var(--chart-3)" } }}
          className="mt-3 h-52 w-full"
        >
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 35 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} unit="%" tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="rating" width={82} tickLine={false} axisLine={false} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, _name, item) => `${value}% · ${item.payload.count} jawaban`}
                />
              }
            />
            <Bar
              dataKey="persen"
              fill="var(--color-persen)"
              radius={8}
              label={{
                position: "right",
                formatter: (value: number) => `${value}%`,
                className: "fill-foreground text-xs font-semibold",
              }}
            />
          </BarChart>
        </ChartContainer>
      ) : (
        <EmptyState className="mt-4" emoji="⭐" title="Belum ada rating" />
      )}
    </section>
  );
}
