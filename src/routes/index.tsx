import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Lock, LogIn, User as UserIcon } from "lucide-react";

import { Blobs, Confetti } from "@/components/fk/Decor";
import { PegadaianLogo } from "@/components/fk/Logo";
import { ErrorNote, Spinner } from "@/components/fk/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authenticate } from "@/lib/formkanwil/logic";
import { getDb, homePathFor, setSession } from "@/lib/formkanwil/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Masuk Admin — FormKanwil" },
      {
        name: "description",
        content: "Masuk ke portal admin FormKanwil untuk mengelola form dan meninjau jawaban.",
      },
      { property: "og:title", content: "Masuk Admin — FormKanwil" },
      {
        property: "og:description",
        content: "Masuk ke portal admin FormKanwil untuk mengelola form dan meninjau jawaban.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSession(null);
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    const result = authenticate(getDb(), username, password);
    window.setTimeout(() => {
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSession(result.user.id);
      navigate({ to: homePathFor(result.user), replace: true });
    }, 200);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-hero">
      <Blobs />
      <Confetti count={22} className="opacity-60" />

      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
        <section className="hidden animate-page-in lg:block">
          <span className="chip">Portal Form Pegadaian</span>
          <h1 className="mt-5 font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-foreground">
            Kelola form dan <span className="text-gradient-brand">tinjau jawaban</span> dalam satu
            portal.
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted-foreground">
            Buat form untuk survei, pendataan, dan masukan. Responden dapat mengakses form
            menggunakan kode yang dibagikan.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {["Survei dan pendataan", "Akses responden dengan kode", "Rekap jawaban per form"].map(
              (t) => (
                <span
                  key={t}
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-card"
                >
                  {t}
                </span>
              ),
            )}
          </div>
        </section>

        <section className="mx-auto w-full max-w-md animate-page-in">
          <img
            src="/login-illustration.svg"
            alt="Dua rekan kerja Pegadaian tersenyum membawa clipboard dan smartphone"
            width={520}
            height={340}
            className="illustration-blend relative z-10 mx-auto -mb-10 h-56 w-auto animate-float-soft sm:h-64"
          />
          <div className="card-soft relative p-6 shadow-lift sm:p-8">
            <div className="space-y-3">
              <PegadaianLogo className="h-8" />
              <div>
                <h2 className="font-display text-2xl font-extrabold tracking-tight">
                  Masuk ke Admin
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Gunakan akun admin untuk mengelola form dan melihat jawaban.
                </p>
              </div>
            </div>

            <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="username">Nama pengguna</Label>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    autoComplete="username"
                    placeholder="Masukkan nama pengguna"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-11"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Kata sandi</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="px-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-mint-soft hover:text-mint-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {error && <ErrorNote>{error}</ErrorNote>}
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? <Spinner className="text-primary-foreground" /> : <LogIn />}
                Masuk
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              Perlu mengisi form?{" "}
              <Link to="/app" className="font-semibold text-primary hover:underline">
                Masukkan kode form
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
