import { Star } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RATING_MAX } from "@/lib/formkanwil/logic";
import type { AnswerValue, Question } from "@/lib/formkanwil/types";
import { cn } from "@/lib/utils";

const RATING_LABEL = ["", "Kurang banget", "Kurang", "Lumayan", "Puas", "Puas banget! 🤩"];

export function QuestionField({
  question,
  value,
  onChange,
  error,
  disabled,
}: {
  question: Question;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue | undefined) => void;
  error?: string;
  disabled?: boolean;
}) {
  const inputId = `q-${question.id}`;
  const invalid = Boolean(error);

  switch (question.type) {
    case "short":
      return (
        <Input
          id={inputId}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Tulis jawabanmu…"
          disabled={disabled}
          aria-invalid={invalid}
        />
      );
    case "long":
      return (
        <Textarea
          id={inputId}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ceritakan di sini, bebas kok…"
          disabled={disabled}
          aria-invalid={invalid}
        />
      );
    case "number":
      return (
        <Input
          id={inputId}
          type="number"
          inputMode="numeric"
          className="max-w-[200px]"
          value={value === undefined ? "" : String(value)}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
          placeholder="0"
          disabled={disabled}
          aria-invalid={invalid}
        />
      );
    case "date":
      return (
        <Input
          id={inputId}
          type="date"
          className="max-w-[220px]"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-invalid={invalid}
        />
      );
    case "dropdown":
      return (
        <Select value={(value as string) ?? ""} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger id={inputId} className="max-w-sm" aria-invalid={invalid}>
            <SelectValue placeholder="Pilih salah satu" />
          </SelectTrigger>
          <SelectContent>
            {(question.options ?? []).map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "single":
    case "multiple": {
      const multi = question.type === "multiple";
      const selected = multi ? ((value as string[]) ?? []) : [(value as string) ?? ""];
      return (
        <div role={multi ? "group" : "radiogroup"} className="grid gap-2 sm:grid-cols-2">
          {(question.options ?? []).map((o) => {
            const active = selected.includes(o);
            return (
              <button
                key={o}
                type="button"
                role={multi ? "checkbox" : "radio"}
                aria-checked={active}
                disabled={disabled}
                onClick={() => {
                  if (!multi) return onChange(o);
                  const next = active ? selected.filter((s) => s !== o) : [...selected, o];
                  onChange(next.length ? next : undefined);
                }}
                className={cn(
                  "flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-all active:scale-[0.98] disabled:cursor-default disabled:active:scale-100",
                  active
                    ? "border-primary bg-mint-soft text-mint-foreground"
                    : "border-input bg-card text-foreground hover:border-mint hover:bg-mint-soft/50",
                )}
              >
                <span
                  className={cn(
                    "grid size-5 shrink-0 place-items-center border-2 transition-colors",
                    multi ? "rounded-md" : "rounded-full",
                    active ? "border-primary bg-primary text-primary-foreground" : "border-input",
                  )}
                >
                  {active && <span className={cn("bg-primary-foreground", multi ? "size-2 rounded-[2px]" : "size-2 rounded-full")} />}
                </span>
                {o}
              </button>
            );
          })}
        </div>
      );
    }
    case "rating": {
      const current = typeof value === "number" ? value : 0;
      return (
        <div>
          <div role="radiogroup" className="flex gap-1.5">
            {Array.from({ length: RATING_MAX }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={current === n}
                aria-label={`${n} bintang`}
                disabled={disabled}
                onClick={() => onChange(n)}
                className="grid size-11 place-items-center rounded-xl transition-transform hover:scale-110 active:scale-95 disabled:cursor-default disabled:hover:scale-100"
              >
                <Star
                  className={cn(
                    "size-8 transition-colors",
                    n <= current ? "fill-gold text-gold" : "text-input",
                  )}
                />
              </button>
            ))}
          </div>
          {current > 0 && (
            <div className="mt-1 text-sm font-medium text-gold-foreground">{RATING_LABEL[current]}</div>
          )}
        </div>
      );
    }
  }
}
