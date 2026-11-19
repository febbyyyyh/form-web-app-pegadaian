import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Lock, LogIn, User as UserIcon } from "lucide-react";

import heroCharacters from "@/assets/hero-characters.webp.asset.json";
import { Blobs, Confetti } from "@/components/fk/Decor";
import { LogoMark } from "@/components/fk/Logo";
import { ErrorNote, Spinner } from "@/components/fk/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authenticate } from "@/lib/formkanwil/logic";
import { getCurrentUser, getDb, homePathFor, setSession } from "@/lib/formkanwil/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Masuk — FormKanwil Pegadaian Kanwil" },
      {
        name: "description",
        content: "Masuk ke FormKanwil, platform form internal Pegadaian Kanwil. Setiap isian berarti.",
      },
      { property: "og:title", content: "Masuk — FormKanwil Pegadaian Kanwil" },
      {
        property: "og:description",
        content: "Setiap isian berarti. Setiap suara didengar. Platform form internal Pegadaian Kanwil.",
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) navigate({ to: homePathFor(user), replace: true });
  }, [navigate]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    window.setTimeout(() => {
      const result = authenticate(getDb(), username, password);
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSession(result.user.id);
      navigate({ to: homePathFor(result.user), replace: true });
    }, 350);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-hero">
      <Blobs />
      <Confetti count={22} className="opacity-60" />

      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
        <section className="hidden animate-page-in lg:block">
          <span className="chip">💚 Untuk seluruh insan Pegadaian Kanwil</span>
          <h1 className="mt-5 font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-foreground">
            Setiap isian <span className="text-gradient-brand">berarti.</span>
            <br />
            Setiap suara <span className="text-gradient-brand">didengar.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted-foreground">
            Survei, pendataan, sampai kotak ide — semua cukup pakai satu kode. Cepat, rapi, dan
            nggak ribet.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {["⚡ Isi < 2 menit", "🔒 Satu akun satu jawaban", "📊 Hasil langsung terekap"].map((t) => (
              <span key={t} className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-card">
                {t}
              </span>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-md animate-page-in">
          <img
            src={heroCharacters.url}
            alt="Dua rekan kerja Pegadaian tersenyum membawa clipboard dan smartphone"
            width={800}
            height={853}
            className="illustration-blend relative z-10 mx-auto -mb-10 h-56 w-auto animate-float-soft sm:h-64"
          />
          <div className="card-soft relative p-6 shadow-lift sm:p-8">
            <div className="flex items-center gap-3">
              <LogoMark className="size-12 text-xl" />
              <div>
                <h2 className="font-display text-2xl font-extrabold tracking-tight">FormKanwil</h2>
                <p className="text-sm text-muted-foreground">
                  Platform form internal Pegadaian Kanwil 💚
                </p>
              </div>
            </div>

            <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    autoComplete="username"
                    placeholder="contoh: febi"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-11"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
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
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
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
              Belum punya akun?{" "}
              <Link to="/daftar" className="font-semibold text-primary hover:underline">
                Daftar
              </Link>
            </p>

            <div className="mt-5 rounded-xl bg-mint-soft px-4 py-3 text-sm text-mint-foreground">
              <div className="font-semibold">🎟️ Akun demo</div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs">
                <span>admin / admin123</span>
                <span>febi / user123</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
