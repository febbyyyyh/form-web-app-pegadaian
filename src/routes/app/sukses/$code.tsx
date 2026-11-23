import { createFileRoute, Link } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";

import { Confetti } from "@/components/fk/Decor";
import { Button } from "@/components/ui/button";
import { normalizeCode } from "@/lib/formkanwil/logic";
import { useDb } from "@/lib/formkanwil/store";

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
  const form = db.forms.find((f) => f.code === normalizeCode(code));

  return (
    <main className="min-h-screen bg-gradient-page px-4 py-8 sm:px-6 sm:py-10">
      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-border bg-gradient-hero px-6 py-10 text-center shadow-lift sm:px-10">
        <Confetti count={40} falling />
        <div className="relative">
          <img
            src="/success-illustration.svg"
            alt="Ilustrasi pegawai merayakan keberhasilan pengiriman form"
            width={420}
            height={300}
            className="mx-auto h-52 w-auto animate-pop-in sm:h-60"
          />
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Yeay! Jawabanmu terkirim 🎉
          </h1>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            Terima kasih! Jawaban untuk{" "}
            <strong className="text-foreground">{form?.title ?? "form ini"}</strong> sudah kami
            terima.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/app">
                <KeyRound /> Isi form lain
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
