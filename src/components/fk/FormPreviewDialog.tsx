import { useState } from "react";
import { CheckCircle2, Eye, RotateCcw, Send } from "lucide-react";

import { QuestionField } from "@/components/fk/QuestionField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getFormPages,
  getPageQuestions,
  isAnswered,
  validateAnswers,
} from "@/lib/formkanwil/logic";
import type { Answers, Form } from "@/lib/formkanwil/types";

export function FormPreviewDialog({
  form,
  triggerLabel = "Pratinjau",
}: {
  form: Form;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Answers>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(false);
  const pages = getFormPages(form);
  const answeredCount = form.questions.filter((question) =>
    isAnswered(answers[question.id]),
  ).length;
  const progress = form.questions.length
    ? Math.round((answeredCount / form.questions.length) * 100)
    : 0;

  function resetPreview() {
    setAnswers({});
    setErrors({});
    setCompleted(false);
  }

  function submitPreview() {
    const nextErrors = validateAnswers(form, answers);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) setCompleted(true);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        resetPreview();
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="brandOutline"
          aria-label="Pratinjau form"
          title={triggerLabel}
        >
          <Eye /> <span className="hidden sm:inline">{triggerLabel}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-extrabold">
            {completed ? "Simulasi selesai 🎉" : "Pratinjau sebagai pengguna"}
          </DialogTitle>
          <DialogDescription>
            {completed
              ? "Jawaban ini hanya simulasi dan tidak disimpan ke data FormKanwil."
              : "Coba isi form ini. Jawaban pratinjau tidak akan disimpan."}
          </DialogDescription>
        </DialogHeader>

        {completed ? (
          <div className="relative overflow-hidden rounded-2xl bg-mint-soft p-8 text-center">
            <CheckCircle2 className="mx-auto size-12 text-primary" />
            <h3 className="mt-3 font-display text-xl font-extrabold">
              Terima kasih sudah mencoba!
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Simulasi untuk <strong>{form.title || "form ini"}</strong> selesai. Tidak ada jawaban
              yang masuk ke rekap.
            </p>
            <Button className="mt-5" variant="brandOutline" onClick={resetPreview}>
              <RotateCcw /> Coba lagi
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl bg-gradient-brand p-5 text-primary-foreground">
              <div className="text-sm font-semibold opacity-90">
                {form.emoji} {form.code}
              </div>
              <h3 className="mt-1 font-display text-2xl font-extrabold">
                {form.title || "Form tanpa judul"}
              </h3>
              {form.description && <p className="mt-2 text-sm opacity-90">{form.description}</p>}
              <div className="mt-4 flex items-center gap-3">
                <div
                  className="h-2 flex-1 overflow-hidden rounded-full bg-white/30"
                  role="progressbar"
                  aria-label="Progres pengisian pratinjau"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                >
                  <div
                    className="h-full rounded-full bg-white transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs font-semibold">
                  {answeredCount}/{form.questions.length} terisi
                </span>
              </div>
            </div>

            {form.questions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Belum ada pertanyaan untuk ditampilkan.
              </div>
            ) : (
              pages.map((page) => (
                <section key={page.id} className="space-y-3">
                  <h4 className="font-display text-lg font-bold">{page.title}</h4>
                  {getPageQuestions(form, page.id).map((question) => (
                    <section key={question.id} className="card-soft p-4 sm:p-5">
                      <label
                        htmlFor={`q-${question.id}`}
                        className="mb-1 block font-semibold text-foreground"
                      >
                        {form.questions.indexOf(question) + 1}.{" "}
                        {question.label || "Pertanyaan tanpa judul"}
                        {question.required && <span className="ml-1 text-destructive">*</span>}
                      </label>
                      {question.help && (
                        <p className="mb-3 text-sm text-muted-foreground">{question.help}</p>
                      )}
                      {!question.help && <div className="mb-3" />}
                      <QuestionField
                        question={question}
                        value={answers[question.id]}
                        error={errors[question.id] ?? ""}
                        onChange={(value) => {
                          setAnswers((current) => ({ ...current, [question.id]: value }));
                          setErrors((current) => {
                            const next = { ...current };
                            delete next[question.id];
                            return next;
                          });
                        }}
                      />
                      {errors[question.id] && (
                        <p className="mt-2 text-sm font-medium text-destructive" role="alert">
                          {errors[question.id]}
                        </p>
                      )}
                    </section>
                  ))}
                </section>
              ))
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">* Pertanyaan wajib diisi</span>
              <Button onClick={submitPreview} disabled={form.questions.length === 0}>
                <Send /> Coba kirim jawaban
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
