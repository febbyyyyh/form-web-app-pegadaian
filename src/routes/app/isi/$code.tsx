import { useMemo, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import { toast } from "sonner";

import { QuestionField } from "@/components/fk/QuestionField";
import { EmptyState, ErrorNote, Spinner } from "@/components/fk/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  getFormPages,
  getPageQuestions,
  isAnswered,
  lookupForm,
  normalizeCode,
  submitResponse,
  validateAnswers,
  validateRespondentIdentity,
} from "@/lib/formkanwil/logic";
import { getDb, setDb, useDb } from "@/lib/formkanwil/store";
import type { Answers } from "@/lib/formkanwil/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/isi/$code")({
  head: ({ params }) => ({
    meta: [
      { title: `Isi Form ${params.code} — FormKanwil` },
      { name: "description", content: "Isi form yang dibagikan kepada Anda." },
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
  const navigate = useNavigate();

  const form = useMemo(() => db.forms.find((f) => f.code === normalizeCode(code)), [db, code]);

  const [answers, setAnswers] = useState<Answers>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [respondentName, setRespondentName] = useState("");
  const [respondentEmail, setRespondentEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const back = (
    <Button asChild variant="ghost" size="sm" className="-ml-3">
      <Link to="/app">
        <ArrowLeft /> Kembali ke kode form
      </Link>
    </Button>
  );

  if (!form || !form.active) {
    const message = lookupForm(db, code);
    return (
      <main className="min-h-screen bg-gradient-page px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-3xl space-y-4">
          {back}
          <EmptyState
            emoji={form ? "😴" : "🔍"}
            title={!message.ok ? message.message : "Form tidak tersedia"}
            description={
              form
                ? "Form ini sudah ditutup oleh admin."
                : "Coba periksa kembali kode form yang diberikan."
            }
            action={
              <Button asChild>
                <Link to="/app">Masukkan kode lain</Link>
              </Button>
            }
          />
        </div>
      </main>
    );
  }

  const shown = answers;
  const formPages = getFormPages(form);
  const currentPage = formPages[currentPageIndex] ??
    formPages[0] ?? { id: "page-1", title: "Halaman 1" };
  const required = form.questions.filter((q) => q.required);
  const identityErrors = validateRespondentIdentity({
    name: respondentName,
    email: respondentEmail,
  });
  const requiredCount = required.length + 2;
  const doneRequired =
    required.filter((q) => isAnswered(shown[q.id])).length +
    Number(!identityErrors.respondentName) +
    Number(!identityErrors.respondentEmail);
  const progress = Math.round((doneRequired / requiredCount) * 100);

  function clearError(key: string) {
    setErrors((current) => {
      const { [key]: _removed, ...rest } = current;
      return rest;
    });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSubmitting(true);
    window.setTimeout(() => {
      const result = submitResponse(getDb(), {
        formId: form.id,
        answers,
        respondent: { name: respondentName, email: respondentEmail },
      });
      setSubmitting(false);
      if (!result.ok) {
        if (result.reason === "invalid") {
          setErrors(result.errors ?? {});
          toast.error("Masih ada yang belum lengkap", {
            description: "Cek identitas dan pertanyaan yang ditandai merah, ya.",
          });
          const firstIdentityError = result.errors?.respondentName
            ? "respondent-name"
            : result.errors?.respondentEmail
              ? "respondent-email"
              : null;
          if (firstIdentityError) {
            document
              .getElementById(firstIdentityError)
              ?.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
          }
          const first = form.questions.find((q) => result.errors?.[q.id]);
          if (first)
            document
              .getElementById(`card-${first.id}`)
              ?.scrollIntoView({ behavior: "smooth", block: "center" });
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
    <main className="min-h-screen bg-gradient-page px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl animate-page-in space-y-5">
        {back}

        <section className="card-soft overflow-hidden">
          <div className="h-2 bg-gradient-brand" />
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip font-mono">Kode: {form.code}</span>
              <span className="chip">{formPages.length} halaman</span>
              <span className="chip">{form.questions.length} pertanyaan</span>
            </div>
            <div className="mt-4 flex items-start gap-3">
              <span className="text-4xl leading-none" aria-hidden>
                {form.emoji}
              </span>
              <div>
                <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                  {form.title}
                </h1>
                <p className="mt-2 text-muted-foreground">{form.description}</p>
              </div>
            </div>
            <div className="mt-5">
              <div className="mb-1.5 flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Progres wajib diisi</span>
                <span className="text-primary">
                  {doneRequired}/{requiredCount}
                </span>
              </div>
              <Progress value={progress} className="h-2.5 bg-mint-soft [&>div]:bg-gradient-brand" />
            </div>
          </div>
        </section>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <section className="card-soft space-y-4 p-5 sm:p-6">
            <div>
              <h2 className="font-display text-xl font-extrabold">Identitas responden</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Isi nama lengkap dan email sebelum menjawab pertanyaan.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="respondent-name" className="text-sm font-medium">
                  Nama lengkap <span className="text-destructive">*</span>
                </label>
                <Input
                  id="respondent-name"
                  required
                  autoComplete="name"
                  value={respondentName}
                  aria-invalid={Boolean(errors.respondentName)}
                  onChange={(event) => {
                    setRespondentName(event.target.value);
                    clearError("respondentName");
                  }}
                  placeholder="Masukkan nama lengkap"
                />
                {errors.respondentName && <ErrorNote>{errors.respondentName}</ErrorNote>}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="respondent-email" className="text-sm font-medium">
                  Email <span className="text-destructive">*</span>
                </label>
                <Input
                  id="respondent-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={respondentEmail}
                  aria-invalid={Boolean(errors.respondentEmail)}
                  onChange={(event) => {
                    setRespondentEmail(event.target.value);
                    clearError("respondentEmail");
                  }}
                  placeholder="nama@contoh.com"
                />
                {errors.respondentEmail && <ErrorNote>{errors.respondentEmail}</ErrorNote>}
              </div>
            </div>
          </section>

          {[currentPage].map((page) => {
            const questions = getPageQuestions(form, page.id);
            return (
              <section key={page.id} className="space-y-4">
                <h2 className="font-display text-xl font-extrabold">{page.title}</h2>
                {questions.map((q) => (
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
                        {form.questions.indexOf(q) + 1}
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
                        error={errors[q.id] ?? ""}
                        onChange={(v) => {
                          setAnswers((a) => ({ ...a, [q.id]: v }));
                          setErrors((e) => {
                            const { [q.id]: _removed, ...rest } = e;
                            return rest;
                          });
                        }}
                      />
                      {errors[q.id] && <ErrorNote className="mt-3">{errors[q.id]}</ErrorNote>}
                    </div>
                  </section>
                ))}
              </section>
            );
          })}

          <div className="sticky bottom-4 z-10 flex flex-col-reverse items-center justify-between gap-3 rounded-2xl border border-border bg-card/90 p-4 shadow-lift backdrop-blur sm:flex-row">
            <div className="flex w-full items-center justify-between gap-3 sm:w-auto">
              <p className="text-sm text-muted-foreground">
                Halaman {currentPageIndex + 1} dari {formPages.length} ·{" "}
                <span className="text-destructive">*</span> wajib diisi
              </p>
              {currentPageIndex > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentPageIndex((index) => index - 1)}
                >
                  <ArrowLeft /> Kembali
                </Button>
              )}
            </div>
            {currentPageIndex < formPages.length - 1 ? (
              <Button
                type="button"
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => {
                  const currentQuestions = getPageQuestions(form, currentPage.id);
                  const pageErrors = validateAnswers(
                    { ...form, questions: currentQuestions },
                    answers,
                  );
                  const identityErrors = validateRespondentIdentity({
                    name: respondentName,
                    email: respondentEmail,
                  });
                  setErrors((current) => ({ ...current, ...identityErrors, ...pageErrors }));
                  const firstIdentityError = identityErrors.respondentName
                    ? "respondent-name"
                    : identityErrors.respondentEmail
                      ? "respondent-email"
                      : null;
                  if (firstIdentityError) {
                    document
                      .getElementById(firstIdentityError)
                      ?.scrollIntoView({ behavior: "smooth", block: "center" });
                    return;
                  }
                  const firstInvalid = currentQuestions.find((question) => pageErrors[question.id]);
                  if (firstInvalid) {
                    document
                      .getElementById(`card-${firstInvalid.id}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "center" });
                    return;
                  }
                  setCurrentPageIndex((index) => index + 1);
                }}
              >
                Halaman berikutnya <ArrowRight />
              </Button>
            ) : (
              <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
                {submitting ? <Spinner className="text-primary-foreground" /> : <Send />}
                Kirim Jawaban
              </Button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
