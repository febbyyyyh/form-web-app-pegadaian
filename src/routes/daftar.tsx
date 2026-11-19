import { useState, type FormEvent, type ReactNode } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Blobs, Confetti } from "@/components/fk/Decor";
import { LogoMark } from "@/components/fk/Logo";
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
import {
  registerUser,
  validateRegistration,
  type RegisterErrors,
  type RegisterInput,
} from "@/lib/formkanwil/logic";
import { getDb, setDb, useDb } from "@/lib/formkanwil/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/daftar")({
  head: () => ({
    meta: [
      { title: "Daftar Akun — FormKanwil" },
      { name: "description", content: "Buat akun FormKanwil untuk mulai mengisi form internal Pegadaian Kanwil." },
      { property: "og:title", content: "Daftar Akun — FormKanwil" },
      { property: "og:description", content: "Tiga langkah singkat untuk bergabung di FormKanwil." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegisterPage,
});

const STEPS = [
  { title: "Data diri", hint: "Kenalan dulu, yuk! 👋", fields: ["name", "username", "email", "password"] },
  { title: "Unit kerja", hint: "Kamu bertugas di mana? 🏢", fields: ["unit"] },
  { title: "Profil", hint: "Sentuhan terakhir biar makin kamu ✨", fields: ["tagline"] },
] as const;

const EMPTY: RegisterInput = { name: "", username: "", email: "", password: "", unit: "", tagline: "" };

function RegisterPage() {
  const navigate = useNavigate();
  const db = useDb();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<RegisterInput>(EMPTY);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  const set = (key: keyof RegisterInput) => (value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  function stepErrors(index: number): RegisterErrors {
    const all = validateRegistration(getDb(), values);
    const out: RegisterErrors = {};
    for (const f of STEPS[index].fields) if (all[f]) out[f] = all[f];
    return out;
  }

  function next(e: FormEvent) {
    e.preventDefault();
    const errs = stepErrors(step);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    const result = registerUser(getDb(), values);
    if (!result.ok) {
      setErrors(result.errors);
      const firstStep = STEPS.findIndex((s) => s.fields.some((f) => result.errors[f]));
      if (firstStep >= 0) setStep(firstStep);
      return;
    }
    setDb(result.db);
    toast.success("Akun berhasil dibuat! 🎉", { description: "Silakan masuk dengan username barumu." });
    navigate({ to: "/" });
  }

  const current = STEPS[step];

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-hero">
      <Blobs />
      <Confetti count={16} className="opacity-50" />
      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
        <Link
          to="/"
          className="mb-4 inline-flex w-fit items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-mint-soft hover:text-mint-foreground"
        >
          <ArrowLeft className="size-4" /> Kembali ke Masuk
        </Link>

        <div className="card-soft animate-page-in p-6 shadow-lift sm:p-8">
          <div className="flex items-center gap-3">
            <LogoMark />
            <div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight">Gabung FormKanwil</h1>
              <p className="text-sm text-muted-foreground">Cuma 3 langkah, nggak sampai semenit.</p>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-primary">
                Langkah {step + 1} dari {STEPS.length}
              </span>
              <span className="text-muted-foreground">{current.title}</span>
            </div>
            <div className="mt-2 flex gap-2">
              {STEPS.map((s, i) => (
                <div
                  key={s.title}
                  className={cn(
                    "h-2 flex-1 rounded-full transition-colors duration-300",
                    i <= step ? "bg-gradient-brand" : "bg-mint-soft",
                  )}
                />
              ))}
            </div>
          </div>

          <form key={step} onSubmit={next} className="mt-6 animate-page-in space-y-4" noValidate>
            <p className="font-display text-lg font-bold">{current.hint}</p>

            {step === 0 && (
              <>
                <Field id="name" label="Nama lengkap" error={errors.name}>
                  <Input id="name" placeholder="Febiola Lengkong" value={values.name} onChange={(e) => set("name")(e.target.value)} aria-invalid={!!errors.name} />
                </Field>
                <Field id="username" label="Username" error={errors.username}>
                  <Input id="username" placeholder="febi" autoComplete="username" value={values.username} onChange={(e) => set("username")(e.target.value.toLowerCase())} aria-invalid={!!errors.username} />
                </Field>
                <Field id="email" label="Email internal" error={errors.email}>
                  <Input id="email" type="email" placeholder="nama@kanwil.pegadaian.co.id" value={values.email} onChange={(e) => set("email")(e.target.value)} aria-invalid={!!errors.email} />
                </Field>
                <Field id="password" label="Password" error={errors.password}>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Minimal 6 karakter" value={values.password} onChange={(e) => set("password")(e.target.value)} aria-invalid={!!errors.password} className="pr-12" />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                      className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-mint-soft hover:text-mint-foreground"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </Field>
              </>
            )}

            {step === 1 && (
              <Field id="unit" label="Unit kerja" error={errors.unit}>
                <Select value={values.unit} onValueChange={set("unit")}>
                  <SelectTrigger id="unit" aria-invalid={!!errors.unit}>
                    <SelectValue placeholder="Pilih unit kerjamu" />
                  </SelectTrigger>
                  <SelectContent>
                    {db.units.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}

            {step === 2 && (
              <>
                <Field id="tagline" label="Tagline singkat (opsional)" error={errors.tagline}>
                  <Input id="tagline" maxLength={80} placeholder="Kopi dulu, baru kerja ☕" value={values.tagline} onChange={(e) => set("tagline")(e.target.value)} />
                </Field>
                <div className="rounded-xl bg-mint-soft p-4 text-sm text-mint-foreground">
                  <div className="font-semibold">Hampir jadi! Cek lagi ya:</div>
                  <div className="mt-1">
                    {values.name} · @{values.username} · {values.unit}
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2">
              {step > 0 && (
                <Button type="button" variant="brandOutline" size="lg" onClick={() => setStep(step - 1)}>
                  <ArrowLeft /> Kembali
                </Button>
              )}
              <Button type="submit" size="lg" className="flex-1">
                {step < STEPS.length - 1 ? (
                  <>
                    Lanjut <ArrowRight />
                  </>
                ) : (
                  <>
                    <Check /> Daftar
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs font-medium text-destructive-foreground">{error}</p>}
    </div>
  );
}
