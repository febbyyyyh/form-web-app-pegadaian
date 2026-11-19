import { useMemo, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ArrowRight, CheckCircle2, ClipboardList, KeyRound, Trophy } from "lucide-react";

import { EmptyState, ErrorNote, InfoNote } from "@/components/fk/States";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { findResponse, lookupForm, normalizeCode, XP_PER_FORM } from "@/lib/formkanwil/logic";
import { useCurrentUser, useDb } from "@/lib/formkanwil/store";
import type { Form } from "@/lib/formkanwil/types";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Beranda — FormKanwil" },
      { name: "description", content: "Masukkan kode form dan lihat riwayat pengisianmu di FormKanwil." },
      { property: "og:title", content: "Beranda — FormKanwil" },
      { property: "og:description", content: "Masukkan kode form dan lihat riwayat pengisianmu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UserHome,
});

function UserHome() {
  const db = useDb();
  const user = useCurrentUser()!;
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState<Form | null>(null);

  const history = useMemo(
    () =>
      db.responses
        .filter((r) => r.userId === user.id)
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
        .map((r) => ({ response: r, form: db.forms.find((f) => f.id === r.formId) }))
        .filter((x): x is { response: typeof x.response; form: Form } => Boolean(x.form)),
    [db, user.id],
  );

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const result = lookupForm(db, code);
    if (!result.ok) {
      setFound(null);
      setError(result.message);
      return;
    }
    setError(null);
    setFound(result.form);
  }

  const firstName = user.name.split(" ")[0];
  const alreadyFilled = found ? findResponse(db, found.id, user.id) : undefined;

  return (
    <div className="space-y-8">
      <section>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>🏢 {user.unit}</Badge>
          <Badge variant="gold">
            <Trophy className="size-3" /> {history.length * XP_PER_FORM} XP
          </Badge>
        </div>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Halo, {firstName} 👋
        </h1>
        <p className="mt-1 text-lg text-muted-foreground">Mari bikin hidup kerja lebih gampang.</p>
      </section>

      <section className="card-soft p-5 sm:p-6">
        <form onSubmit={onSubmit} className="space-y-3" noValidate>
          <Label htmlFor="code" className="text-sm font-semibold">
            Kode Form
          </Label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <KeyRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="code"
                value={code}
                onChange={(e) => {
                  setCode(normalizeCode(e.target.value));
                  setError(null);
                }}
                placeholder="CONTOH: SURVEI26"
                autoComplete="off"
                maxLength={12}
                className="h-12 pl-11 font-mono text-base font-semibold uppercase tracking-[0.2em]"
              />
            </div>
            <Button type="submit" size="lg">
              Buka Form <ArrowRight />
            </Button>
          </div>
          {error && <ErrorNote>{error}</ErrorNote>}
        </form>
        <InfoNote className="mt-4">
          💡 Kode form didapatkan dari admin atau panitia. Setiap form hanya bisa diisi satu kali
          per akun.
        </InfoNote>
      </section>

      {found && (
        <section className="card-soft card-hover animate-page-in overflow-hidden">
          <div className="bg-gradient-brand px-6 py-5 text-primary-foreground">
            <div className="text-xs font-semibold uppercase tracking-widest opacity-90">
              Form ditemukan 🎯
            </div>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-3xl" aria-hidden>
                {found.emoji}
              </span>
              <h2 className="font-display text-xl font-extrabold">{found.title}</h2>
            </div>
          </div>
          <div className="space-y-4 p-6">
            <p className="text-muted-foreground">{found.description}</p>
            <div className="flex flex-wrap gap-2">
              <span className="chip">Kode: {found.code}</span>
              <span className="chip">{found.questions.length} pertanyaan</span>
              <span className="chip">±{Math.max(1, Math.ceil(found.questions.length / 2))} menit</span>
            </div>
            {alreadyFilled ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-mint-soft px-4 py-3">
                <span className="flex items-center gap-2 text-sm font-semibold text-mint-foreground">
                  <CheckCircle2 className="size-4" /> Kamu sudah mengisi form ini. Makasih! 💚
                </span>
                <Button asChild variant="brandOutline" size="sm">
                  <Link to="/app/isi/$code" params={{ code: found.code }}>
                    Lihat jawabanku
                  </Link>
                </Button>
              </div>
            ) : (
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/app/isi/$code" params={{ code: found.code }}>
                  Mulai isi form <ArrowRight />
                </Link>
              </Button>
            )}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-xl font-extrabold">
            <ClipboardList className="size-5 text-primary" /> Form Saya / Riwayat
          </h2>
          <span className="text-sm text-muted-foreground">{history.length} form</span>
        </div>
        {history.length === 0 ? (
          <EmptyState
            emoji="🌱"
            title="Belum ada riwayat"
            description="Form yang sudah kamu isi akan muncul di sini. Yuk mulai dari kode pertamamu!"
          />
        ) : (
          <ul className="space-y-3">
            {history.map(({ response, form }) => (
              <li key={response.id}>
                <Link
                  to="/app/isi/$code"
                  params={{ code: form.code }}
                  className="card-soft card-hover flex items-center gap-4 p-4"
                >
                  <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-mint-soft text-2xl">
                    {form.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-foreground">{form.title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      Kode {form.code} ·{" "}
                      {format(new Date(response.submittedAt), "d MMM yyyy, HH:mm", { locale: localeId })}
                    </div>
                  </div>
                  <span className="chip shrink-0">
                    <CheckCircle2 className="size-3.5" /> Sudah diisi
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
