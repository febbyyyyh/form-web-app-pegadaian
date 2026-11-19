import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  Copy,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { EmptyState, ErrorNote } from "@/components/fk/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { generateCode, normalizeCode, uid, validateFormDraft } from "@/lib/formkanwil/logic";
import { getDb, setDb, useDb } from "@/lib/formkanwil/store";
import {
  CHOICE_TYPES,
  QUESTION_TYPE_LABEL,
  type Form,
  type Question,
  type QuestionType,
} from "@/lib/formkanwil/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/forms/$formId/")({
  head: () => ({
    meta: [
      { title: "Edit Form — FormKanwil" },
      { name: "description", content: "Susun pertanyaan dan atur kode form FormKanwil." },
      { property: "og:title", content: "Edit Form — FormKanwil" },
      { property: "og:description", content: "Susun pertanyaan dan atur kode form." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FormBuilderPage,
});

const EMOJIS = ["📝", "📊", "💡", "🏝️", "🦺", "🎉", "🍱", "🏆", "📣", "🧠", "💚", "🚀"];

function FormBuilderPage() {
  const { formId } = Route.useParams();
  const db = useDb();
  const saved = db.forms.find((f) => f.id === formId);

  if (!saved) {
    return (
      <EmptyState
        emoji="🔍"
        title="Form tidak ditemukan"
        description="Mungkin sudah dihapus."
        action={
          <Button asChild>
            <Link to="/admin/forms">Kembali ke daftar form</Link>
          </Button>
        }
      />
    );
  }
  return <Builder key={saved.id} saved={saved} responseCount={db.responses.filter((r) => r.formId === saved.id).length} />;
}

function Builder({ saved, responseCount }: { saved: Form; responseCount: number }) {
  const [draft, setDraft] = useState<Form>(saved);
  const [error, setError] = useState<string | null>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const patch = (p: Partial<Form>) => {
    setDraft((d) => ({ ...d, ...p }));
    setError(null);
  };
  const patchQ = (id: string, p: Partial<Question>) =>
    patch({ questions: draft.questions.map((q) => (q.id === id ? { ...q, ...p } : q)) });

  function addQuestion(type: QuestionType) {
    const q: Question = {
      id: uid("q"),
      type,
      label: "",
      required: false,
      options: CHOICE_TYPES.includes(type) ? ["Opsi 1", "Opsi 2"] : undefined,
    };
    patch({ questions: [...draft.questions, q] });
  }

  function move(index: number, dir: -1 | 1) {
    const qs = [...draft.questions];
    const j = index + dir;
    if (j < 0 || j >= qs.length) return;
    [qs[index], qs[j]] = [qs[j], qs[index]];
    patch({ questions: qs });
  }

  function save() {
    const cleaned: Form = {
      ...draft,
      code: normalizeCode(draft.code),
      title: draft.title.trim(),
      questions: draft.questions.map((q) => ({
        ...q,
        label: q.label.trim(),
        options: CHOICE_TYPES.includes(q.type)
          ? (q.options ?? []).map((o) => o.trim()).filter(Boolean)
          : undefined,
      })),
    };
    const err = validateFormDraft(getDb(), cleaned);
    if (err) {
      setError(err);
      toast.error(err);
      return;
    }
    const next = { ...cleaned, updatedAt: new Date().toISOString() };
    setDb((d) => ({ ...d, forms: d.forms.map((f) => (f.id === next.id ? next : f)) }));
    setDraft(next);
    toast.success("Form tersimpan 💾", {
      description: next.active ? `Bagikan kode ${next.code} ke peserta.` : "Aktifkan form agar bisa diisi.",
    });
  }

  return (
    <div className="space-y-5 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link to="/admin/forms">
            <ArrowLeft /> Semua form
          </Link>
        </Button>
        <Button asChild variant="secondary" size="sm">
          <Link to="/admin/forms/$formId/jawaban" params={{ formId: saved.id }}>
            <BarChart3 /> {responseCount} jawaban
          </Link>
        </Button>
      </div>

      {responseCount > 0 && (
        <div className="rounded-xl border border-gold bg-gold-soft px-4 py-3 text-sm text-gold-foreground">
          ⚠️ Form ini sudah punya {responseCount} jawaban. Mengubah atau menghapus pertanyaan bisa membuat rekap lama tidak lengkap.
        </div>
      )}

      {/* Meta */}
      <section className="card-soft overflow-hidden">
        <div className="h-2 bg-gradient-brand" />
        <div className="grid gap-5 p-6 md:grid-cols-[1fr_260px]">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Judul form</Label>
              <Input
                id="title"
                value={draft.title}
                onChange={(e) => patch({ title: e.target.value })}
                className="h-12 font-display text-lg font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desc">Deskripsi</Label>
              <Textarea
                id="desc"
                value={draft.description}
                onChange={(e) => patch({ description: e.target.value })}
                placeholder="Ceritakan singkat tujuan form ini, biar peserta semangat ngisi ✨"
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ikon</Label>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => patch({ emoji: e })}
                    className={cn(
                      "grid size-10 place-items-center rounded-xl border-2 text-xl transition-all hover:scale-105 active:scale-95",
                      draft.emoji === e ? "border-primary bg-mint-soft" : "border-transparent bg-muted",
                    )}
                    aria-label={`Pilih ikon ${e}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4 rounded-2xl bg-mint-soft/60 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="code">Kode form</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  value={draft.code}
                  maxLength={12}
                  onChange={(e) => patch({ code: normalizeCode(e.target.value) })}
                  className="font-mono font-semibold tracking-widest"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-11 shrink-0"
                  onClick={() => patch({ code: generateCode(getDb()) })}
                  aria-label="Buat kode acak"
                  title="Buat kode acak"
                >
                  <RefreshCw />
                </Button>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(draft.code);
                  toast.success("Kode disalin 📋");
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-mint-foreground hover:underline"
              >
                <Copy className="size-3" /> Salin kode
              </button>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-card px-4 py-3">
              <div>
                <div className="text-sm font-semibold">Form aktif</div>
                <div className="text-xs text-muted-foreground">
                  {draft.active ? "Bisa diisi pakai kode" : "Belum bisa diisi"}
                </div>
              </div>
              <Switch checked={draft.active} onCheckedChange={(v) => patch({ active: v })} />
            </div>
          </div>
        </div>
      </section>

      {/* Questions */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-extrabold">Pertanyaan ({draft.questions.length})</h2>
      </div>

      {draft.questions.length === 0 && (
        <EmptyState emoji="🤔" title="Belum ada pertanyaan" description="Tambahkan pertanyaan dari tombol di bawah." />
      )}

      {draft.questions.map((q, i) => (
        <section key={q.id} className="card-soft p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="mt-2.5 grid size-7 shrink-0 place-items-center rounded-full bg-mint-soft text-xs font-bold text-mint-foreground">
              {i + 1}
            </span>
            <div className="flex-1 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  value={q.label}
                  onChange={(e) => patchQ(q.id, { label: e.target.value })}
                  placeholder="Tulis pertanyaannya…"
                  className="flex-1 font-semibold"
                  aria-label={`Teks pertanyaan ${i + 1}`}
                />
                <Select
                  value={q.type}
                  onValueChange={(v) => {
                    const type = v as QuestionType;
                    patchQ(q.id, {
                      type,
                      options: CHOICE_TYPES.includes(type) ? (q.options?.length ? q.options : ["Opsi 1", "Opsi 2"]) : undefined,
                    });
                  }}
                >
                  <SelectTrigger className="sm:w-48" aria-label="Jenis pertanyaan">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(QUESTION_TYPE_LABEL) as QuestionType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {QUESTION_TYPE_LABEL[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                value={q.help ?? ""}
                onChange={(e) => patchQ(q.id, { help: e.target.value || undefined })}
                placeholder="Keterangan tambahan (opsional)"
                className="h-9 text-sm"
              />

              {CHOICE_TYPES.includes(q.type) && (
                <div className="space-y-2">
                  {(q.options ?? []).map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <span className={cn("size-4 shrink-0 border-2 border-input", q.type === "multiple" ? "rounded-md" : "rounded-full")} />
                      <Input
                        value={opt}
                        onChange={(e) => {
                          const options = [...(q.options ?? [])];
                          options[oi] = e.target.value;
                          patchQ(q.id, { options });
                        }}
                        className="h-9 text-sm"
                        aria-label={`Opsi ${oi + 1}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0"
                        disabled={(q.options ?? []).length <= 2}
                        onClick={() => patchQ(q.id, { options: (q.options ?? []).filter((_, k) => k !== oi) })}
                        aria-label="Hapus opsi"
                      >
                        <X />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-primary"
                    onClick={() => patchQ(q.id, { options: [...(q.options ?? []), `Opsi ${(q.options ?? []).length + 1}`] })}
                  >
                    <Plus /> Tambah opsi
                  </Button>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <Switch checked={q.required} onCheckedChange={(v) => patchQ(q.id, { required: v })} />
                  Wajib diisi
                </label>
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Naikkan">
                    <ArrowUp />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => move(i, 1)} disabled={i === draft.questions.length - 1} aria-label="Turunkan">
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const qs = [...draft.questions];
                      qs.splice(i + 1, 0, { ...q, id: uid("q"), options: q.options ? [...q.options] : undefined });
                      patch({ questions: qs });
                    }}
                    aria-label="Duplikat"
                  >
                    <Copy />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="hover:bg-destructive-soft hover:text-destructive-foreground"
                    onClick={() => patch({ questions: draft.questions.filter((x) => x.id !== q.id) })}
                    aria-label="Hapus pertanyaan"
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      <section className="rounded-2xl border-2 border-dashed border-mint bg-card/60 p-5">
        <div className="mb-3 text-sm font-semibold text-muted-foreground">Tambah pertanyaan</div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(QUESTION_TYPE_LABEL) as QuestionType[]).map((t) => (
            <Button key={t} type="button" variant="outline" size="sm" onClick={() => addQuestion(t)}>
              <Plus /> {QUESTION_TYPE_LABEL[t]}
            </Button>
          ))}
        </div>
      </section>

      {error && <ErrorNote>{error}</ErrorNote>}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <span className="text-sm text-muted-foreground">
            {dirty ? "✏️ Ada perubahan yang belum disimpan" : "✅ Semua perubahan tersimpan"}
          </span>
          <div className="flex gap-2">
            {dirty && (
              <Button variant="ghost" onClick={() => setDraft(saved)}>
                Batalkan
              </Button>
            )}
            <Button onClick={save} disabled={!dirty}>
              <Save /> Simpan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
