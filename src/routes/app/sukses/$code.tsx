import { createFileRoute, Link } from "@tanstack/react-router";
import { Home, KeyRound, Trophy } from "lucide-react";

import successCharacter from "@/assets/success-character.webp.asset.json";
import { Confetti } from "@/components/fk/Decor";
import { Button } from "@/components/ui/button";
import { normalizeCode, XP_PER_FORM } from "@/lib/formkanwil/logic";
import { useCurrentUser, useDb } from "@/lib/formkanwil/store";

export const Route = createFileRoute("/app/sukses/$code")({
  head: () => ({
    meta: [
      { title: "Jawaban Terkirim! — FormKanwil" },
      { name: "description", content: "Terima kasih, jawabanmu sudah kami terima." },
      { property: "og:title", content: "Jawaban Terkirim! — FormKanwil" },
      { property: "og:description", content: "Setiap isian berarti. Setiap suara didengar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const { code } = Route.useParams();
  const db = useDb();
  const user = useCurrentUser()!;
  const form = db.forms.find((f) => f.code === normalizeCode(code));
  const total = db.responses.filter((r) => r.userId === user.id).length;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-hero px-6 py-10 text-center shadow-lift sm:px-10">
      <Confetti count={40} falling />
      <div className="relative">
        <img
          src={successCharacter.url}
          alt="Karakter pegawai melompat gembira memegang ponsel bertanda centang"
          width={640}
          height={960}
          className="illustration-blend mx-auto h-64 w-auto animate-pop-in sm:h-72"
        />
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Yeay! Jawabanmu terkirim 🎉
        </h1>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Terima kasih, {user.name.split(" ")[0]}! Masukanmu untuk{" "}
          <strong className="text-foreground">{form?.title ?? "form ini"}</strong> sudah kami terima.
          Setiap isian berarti. Setiap suara didengar.
        </p>

        <div className="mx-auto mt-6 flex w-fit animate-pop-in items-center gap-3 rounded-2xl bg-gold-soft px-5 py-3 [animation-delay:300ms]">
          <div className="grid size-10 place-items-center rounded-full bg-gold text-navy">
            <Trophy className="size-5" />
          </div>
          <div className="text-left">
            <div className="font-display text-lg font-extrabold text-gold-foreground">+{XP_PER_FORM} XP</div>
            <div className="text-xs text-gold-foreground">Total {total * XP_PER_FORM} XP · {total} form diisi</div>
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/app">
              <Home /> Kembali ke Beranda
            </Link>
          </Button>
          <Button asChild variant="brandOutline" size="lg">
            <Link to="/app">
              <KeyRound /> Isi form lain
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
