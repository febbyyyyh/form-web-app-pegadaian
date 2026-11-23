import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, KeyRound } from "lucide-react";

import { Blobs } from "@/components/fk/Decor";
import { ErrorNote } from "@/components/fk/States";
import { PegadaianLogo } from "@/components/fk/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lookupForm, normalizeCode } from "@/lib/formkanwil/logic";
import { useDb } from "@/lib/formkanwil/store";
import type { Form } from "@/lib/formkanwil/types";

export const Route = createFileRoute("/app/")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === "string" ? search.code : "",
  }),
  head: () => ({
    meta: [
      { title: "Isi Form — FormKanwil" },
      { name: "description", content: "Masukkan kode untuk membuka dan mengisi form." },
      { property: "og:title", content: "Isi Form — FormKanwil" },
      { property: "og:description", content: "Masukkan kode form untuk mulai mengisi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PublicFormEntryPage,
});

function PublicFormEntryPage() {
  const db = useDb();
  const navigate = useNavigate();
  const { code: sharedCode } = Route.useSearch();
  const [code, setCode] = useState(sharedCode);
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState<Form | null>(null);

  useEffect(() => {
    setCode(sharedCode);
    setFound(null);
    setError(null);
  }, [sharedCode]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const result = lookupForm(db, code);
    if (!result.ok) {
      setFound(null);
      setError(result.message);
      return;
    }
    setCode(result.form.code);
    setError(null);
    setFound(result.form);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-hero px-4 py-10 sm:px-6">
      <Blobs />
      <div className="relative mx-auto max-w-xl">
        <div className="mb-8 flex justify-center">
          <Link to="/app" aria-label="FormKanwil">
            <PegadaianLogo className="h-9" />
          </Link>
        </div>

        <section className="card-soft p-6 shadow-lift sm:p-8">
          <div className="text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-mint-soft text-primary">
              <KeyRound className="size-6" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              Masukkan kode form
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Tidak perlu login. Gunakan kode yang diberikan admin.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-3" noValidate>
            <Label htmlFor="form-code">Kode form</Label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                id="form-code"
                value={code}
                onChange={(event) => {
                  setCode(normalizeCode(event.target.value));
                  setFound(null);
                  setError(null);
                }}
                placeholder="Masukkan kode"
                autoComplete="off"
                maxLength={12}
                className="h-12 font-mono text-base font-semibold uppercase tracking-[0.2em]"
              />
              <Button type="submit" size="lg" className="shrink-0">
                Buka form <ArrowRight />
              </Button>
            </div>
            {error && <ErrorNote>{error}</ErrorNote>}
          </form>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Data demo hanya tersedia di browser yang menyimpan form.
          </p>

          {found && (
            <div className="mt-6 rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start gap-3">
                <span className="text-3xl" aria-hidden>
                  {found.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-lg font-bold">{found.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {found.description || "Form siap diisi."}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {found.questions.length} pertanyaan
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="lg"
                className="mt-5 w-full"
                onClick={() =>
                  navigate({
                    to: "/app/isi/$code",
                    params: { code: found.code },
                  })
                }
              >
                Mulai isi form <ArrowRight />
              </Button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
