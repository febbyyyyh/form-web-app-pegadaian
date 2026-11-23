import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BarChart3, Copy, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/fk/States";
import { PageTitle } from "@/components/fk/StatCard";
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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { generateCode, uid } from "@/lib/formkanwil/logic";
import { setDb, useDb } from "@/lib/formkanwil/store";
import type { Form } from "@/lib/formkanwil/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/forms/")({
  head: () => ({
    meta: [
      { title: "Kelola Form — FormKanwil" },
      {
        name: "description",
        content: "Buat, aktifkan, dan kelola form internal Pegadaian Kanwil.",
      },
      { property: "og:title", content: "Kelola Form — FormKanwil" },
      { property: "og:description", content: "Buat, aktifkan, dan kelola form internal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FormsPage,
});

const FILTERS = [
  { key: "all", label: "Semua" },
  { key: "active", label: "Aktif" },
  { key: "draft", label: "Draft" },
  { key: "closed", label: "Ditutup" },
] as const;

function getFormStatus(form: Form): "draft" | "active" | "closed" {
  return form.active ? "active" : form.status === "closed" ? "closed" : "draft";
}

function FormsPage() {
  const db = useDb();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");

  const forms = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...db.forms]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .filter((f) => (filter === "all" ? true : getFormStatus(f) === filter))
      .filter((f) => !q || f.title.toLowerCase().includes(q) || f.code.toLowerCase().includes(q));
  }, [db.forms, query, filter]);

  function createForm() {
    const now = new Date().toISOString();
    const firstPageId = uid("page");
    const form: Form = {
      id: uid("frm"),
      code: generateCode(db),
      title: "",
      description: "",
      emoji: "📝",
      active: false,
      status: "draft",
      pages: [{ id: firstPageId, title: "Halaman 1" }],
      createdAt: now,
      updatedAt: now,
      questions: [],
    };
    setDb((d) => ({ ...d, forms: [...d.forms, form] }));
    navigate({ to: "/admin/forms/$formId", params: { formId: form.id } });
  }

  function toggleActive(form: Form, active: boolean) {
    setDb((d) => ({
      ...d,
      forms: d.forms.map((f) =>
        f.id === form.id
          ? {
              ...f,
              active,
              status: active ? "active" : "closed",
              updatedAt: new Date().toISOString(),
            }
          : f,
      ),
    }));
    toast.success(active ? `"${form.title}" sekarang aktif 🟢` : `"${form.title}" dinonaktifkan`);
  }

  function deleteForm(form: Form) {
    setDb((d) => ({
      ...d,
      forms: d.forms.filter((f) => f.id !== form.id),
      responses: d.responses.filter((r) => r.formId !== form.id),
    }));
    toast.success("Form dihapus");
  }

  return (
    <div>
      <PageTitle
        title="Kelola Form"
        subtitle="Bikin form, bagikan tautannya, dan pantau jawaban yang masuk."
        action={
          <Button size="lg" onClick={createForm}>
            <Plus /> Buat form baru
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari judul atau kode…"
            className="pl-11"
          />
        </div>
        <div className="flex gap-1 rounded-full border border-border bg-card p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                filter === f.key
                  ? "bg-gradient-brand text-primary-foreground"
                  : "text-muted-foreground hover:bg-mint-soft",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {forms.length === 0 ? (
        <EmptyState
          emoji="📭"
          title={db.forms.length === 0 ? "Belum ada form" : "Tidak ada yang cocok"}
          description={
            db.forms.length === 0
              ? "Belum ada form. Buat form pertama kamu!"
              : "Coba kata kunci atau filter lain."
          }
          action={
            db.forms.length === 0 ? (
              <Button onClick={createForm}>
                <Plus /> Buat form pertama
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {forms.map((form) => {
            const count = db.responses.filter((r) => r.formId === form.id).length;
            return (
              <article key={form.id} className="card-soft card-hover flex flex-col p-5">
                <div className="flex items-start gap-4">
                  <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-mint-soft text-2xl">
                    {form.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-lg font-bold leading-snug">{form.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {form.description || "Belum ada deskripsi."}
                    </p>
                  </div>
                  <Switch
                    checked={form.active}
                    onCheckedChange={(v) => toggleActive(form, v)}
                    aria-label={form.active ? "Tutup form" : "Aktifkan form"}
                  />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(form.code);
                      toast.success(`Kode ${form.code} disalin 📋`);
                    }}
                    className="chip font-mono transition-colors hover:bg-mint"
                    title="Salin kode"
                  >
                    {form.code} <Copy className="size-3" />
                  </button>
                  <span className="chip">{form.questions.length} pertanyaan</span>
                  <span className="chip">{count} jawaban</span>
                  <span className={cn("chip", !form.active && "bg-muted text-muted-foreground")}>
                    {form.active
                      ? "🟢 Aktif"
                      : form.status === "closed"
                        ? "⚫ Ditutup"
                        : "⚪ Draft"}
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
                  <Button asChild variant="brandOutline" size="sm">
                    <Link to="/admin/forms/$formId" params={{ formId: form.id }}>
                      <Pencil /> Edit
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" size="sm">
                    <Link to="/admin/forms/$formId/jawaban" params={{ formId: form.id }}>
                      <BarChart3 /> Jawaban & statistik
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto hover:bg-destructive-soft hover:text-destructive-foreground"
                      >
                        <Trash2 /> Hapus
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus form ini?</AlertDialogTitle>
                        <AlertDialogDescription>
                          "{form.title}" beserta {count} jawabannya akan terhapus permanen.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={() => deleteForm(form)}>
                          Ya, hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
