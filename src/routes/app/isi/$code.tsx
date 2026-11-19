import { useMemo, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ArrowLeft, CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";

import { QuestionField } from "@/components/fk/QuestionField";
import { EmptyState, ErrorNote, Spinner } from "@/components/fk/States";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  findResponse,
  isAnswered,
  lookupForm,
  normalizeCode,
  submitResponse,
} from "@/lib/formkanwil/logic";
import { getDb, setDb, useCurrentUser, useDb } from "@/lib/formkanwil/store";
import type { Answers } from "@/lib/formkanwil/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/isi/$code")({
  head: ({ params }) => ({
    meta: [
      { title: `Isi Form ${params.code} — FormKanwil` },
      { name: "description", content: "Isi form internal Pegadaian Kanwil. Setiap isian berarti." },
      { property: "og:title", content: `Isi Form ${params.code} — FormKanwil` },
      { property: "og:description", content: "Setiap isian berarti. Setiap suara didengar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FillFormPage,
});

function FillFormPage() {
  const { code } = Route.useParams();
  const db = useDb();
  const user = useCurrentUser()!;
  const navigate = useNavigate();

  const form = useMemo(() => db.forms.find((f) => f.code === normalizeCode(code)), [db, code]);
  const existing = form ? findResponse(db, form.id, user.id) : undefined;

  const [answers, setAnswers] = useState<Answers>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const back = (
    <Button asChild variant="ghost" size="sm" className="-ml-3">
      <Link to="/app">
        <ArrowLeft /> Kembali ke beranda
      </Link>
    </Button>
  );

  if (!form || (!form.active && !existing)) {
    const message = lookupForm(db, code);
    return (
      <div className="space-y-4">
        {back}
        <EmptyState
          emoji={form ? "😴" : "🔍"}
          title={!message.ok ? message.message : "Form tidak tersedia"}
          description={
            form
              ? "Form ini sudah ditutup oleh admin. Tanyakan ke panitia kalau masih butuh, ya."
              : "Coba cek lagi kodenya. Kode biasanya terdiri dari huruf dan angka."
          }
          action={
            <Button asChild>
              <Link to="/app">Masukkan kode lain</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const shown = existing ? existing.answers : answers;
  const required = form.questions.filter((q) => q.required);
  const doneRequired = required.filter((q) => isAnswered(shown[q.id])).length;
  const progress = required.length ? Math.round((doneRequired / required.length) * 100) : 100;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSubmitting(true);
    window.setTimeout(() => {
      const result = submitResponse(getDb(), { formId: form.id, userId: user.id, answers });
      setSubmitting(false);
      if (!result.ok) {
        if (result.reason === "invalid") {
          setErrors(result.errors ?? {});
          toast.error("Masih ada yang belum lengkap", { description: "Cek pertanyaan yang ditandai merah, ya." });
          const first = form.questions.find((q) => result.errors?.[q.id]);
          if (first) document.getElementById(`card-${first.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (result.reason === "already_submitted") {
          toast.info("Kamu sudah mengisi form ini sebelumnya.");
        } else {
          toast.error("Form sedang tidak aktif");
        }
        return;
      }
      setDb(result.db);
      navigate({ to: "/app/sukses/$code", params: { code: form.code }, replace: true });
    }, 500);
  }

  return (
    <div className="space-y-5">
      {back}

      <section className="card-soft overflow-hidden">
        <div className="h-2 bg-gradient-brand" />
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip font-mono">Kode: {form.code}</span>
            <span className="chip">{form.questions.length} pertanyaan</span>
            {existing && (
              <span className="chip">
                <CheckCircle2 className="size-3.5" /> Sudah diisi
              </span>
            )}
          </div>
          <div className="mt-4 flex items-start gap-3">
            <span className="text-4xl leading-none" aria-hidden>
              {form.emoji}
            </span>
            <div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{form.title}</h1>
              <p className="mt-2 text-muted-foreground">{form.description}</p>
            </div>
          </div>
          {existing ? (
            <div className="mt-5 rounded-xl bg-mint-soft px-4 py-3 text-sm text-mint-foreground">
              ✅ Jawabanmu terkirim pada{" "}
              <strong>{format(new Date(existing.submittedAt), "d MMMM yyyy, HH:mm", { locale: localeId })}</strong>.
              Setiap form hanya bisa diisi satu kali per akun.
            </div>
          ) : (
            <div className="mt-5">
              <div className="mb-1.5 flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Progres wajib diisi</span>
                <span className="text-primary">
                  {doneRequired}/{required.length}
                </span>
              </div>
              <Progress value={progress} className="h-2.5 bg-mint-soft [&>div]:bg-gradient-brand" />
            </div>
          )}
        </div>
      </section>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {form.questions.map((q, i) => (
          <section
            key={q.id}
            id={`card-${q.id}`}
            className={cn(
              "card-soft p-5 transition-colors sm:p-6",
              errors[q.id] && "border-destructive/50",
            )}
          >
            <label htmlFor={`q-${q.id}`} className="flex gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-mint-soft text-xs font-bold text-mint-foreground">
                {i + 1}
              </span>
              <span className="pt-0.5 font-display text-base font-bold text-foreground">
                {q.label}
                {q.required && <span className="ml-1 text-destructive">*</span>}
              </span>
            </label>
            {q.help && <p className="ml-10 mt-1 text-sm text-muted-foreground">{q.help}</p>}
            <div className="mt-4 sm:ml-10">
              <QuestionField
                question={q}
                value={shown[q.id]}
                disabled={Boolean(existing)}
                error={errors[q.id]}
                onChange={(v) => {
                  setAnswers((a) => ({ ...a, [q.id]: v }));
                  setErrors((e) => {
                    const { [q.id]: _removed, ...rest } = e;
                    return rest;
                  });
                }}
              />
              {existing && !isAnswered(shown[q.id]) && (
                <p className="mt-2 text-sm italic text-muted-foreground">Tidak dijawab</p>
              )}
              {errors[q.id] && <ErrorNote className="mt-3">{errors[q.id]}</ErrorNote>}
            </div>
          </section>
        ))}

        {!existing && (
          <div className="sticky bottom-4 z-10 flex flex-col-reverse items-center justify-between gap-3 rounded-2xl border border-border bg-card/90 p-4 shadow-lift backdrop-blur sm:flex-row">
            <p className="text-sm text-muted-foreground">
              <span className="text-destructive">*</span> wajib diisi · Jawaban tidak bisa diubah setelah dikirim
            </p>
            <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
              {submitting ? <Spinner className="text-primary-foreground" /> : <Send />}
              Kirim Jawaban
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
