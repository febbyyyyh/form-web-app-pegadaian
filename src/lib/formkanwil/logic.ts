import {
  CHOICE_TYPES,
  type Answers,
  type AnswerValue,
  type Database,
  type Form,
  type FormPage,
  type FormResponse,
  type Question,
  type User,
} from "./types";

export const RATING_MAX = 5;

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function normalizeCode(code: string): string {
  return code.replace(/\s+/g, "").toUpperCase();
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

/* ---------------- Auth ---------------- */

export type AuthResult = { ok: true; user: User } | { ok: false; error: string };

export function authenticate(db: Database, username: string, password: string): AuthResult {
  const uname = normalizeUsername(username);
  if (!uname || !password) return { ok: false, error: "Username dan password wajib diisi ya." };
  const user = db.users.find((u) => u.role === "admin");
  if (!user || user.username !== uname || user.password !== password) {
    return { ok: false, error: "Username atau password salah. Coba cek lagi, ya!" };
  }
  if (!user.active) {
    return { ok: false, error: "Akun kamu sedang dinonaktifkan. Hubungi admin Kanwil." };
  }
  return { ok: true, user };
}

/* ---------------- Forms ---------------- */

export type LookupResult =
  | { ok: true; form: Form }
  | { ok: false; reason: "empty" | "not_found" | "inactive"; message: string };

export function lookupForm(db: Database, rawCode: string): LookupResult {
  const code = normalizeCode(rawCode);
  if (!code) return { ok: false, reason: "empty", message: "Masukkan kode form dulu, ya." };
  const form = db.forms.find((f) => f.code === code);
  if (!form) return { ok: false, reason: "not_found", message: "Kode form tidak ditemukan" };
  if (!form.active) return { ok: false, reason: "inactive", message: "Form sedang tidak aktif" };
  return { ok: true, form };
}

export function createFormShareLink(origin: string, code: string): string {
  const url = new URL("/app", origin);
  url.searchParams.set("code", normalizeCode(code));
  return url.toString();
}

export function isAnswered(value: AnswerValue | undefined): boolean {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "number") return !Number.isNaN(value);
  return value.trim().length > 0;
}

export function getFormPages(form: Form): FormPage[] {
  return form.pages?.length
    ? form.pages
    : [
        {
          id: form.questions.find((question) => question.pageId)?.pageId ?? "page-1",
          title: "Halaman 1",
        },
      ];
}

export function getPageQuestions(form: Form, pageId: string): Question[] {
  const pages = getFormPages(form);
  return form.questions.filter(
    (question) => question.pageId === pageId || (!question.pageId && pages[0]?.id === pageId),
  );
}

export function validateAnswers(form: Form, answers: Answers): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const q of form.questions) {
    const value = answers[q.id];
    if (!isAnswered(value)) {
      if (q.required) errors[q.id] = "Pertanyaan ini wajib diisi.";
      continue;
    }
    if (q.type === "rating") {
      const n = Number(value);
      if (!Number.isInteger(n) || n < 1 || n > RATING_MAX)
        errors[q.id] = "Pilih 1 sampai 5 bintang.";
    }
    if (q.type === "number" && Number.isNaN(Number(value))) {
      errors[q.id] = "Isi dengan angka, ya.";
    }
    if (CHOICE_TYPES.includes(q.type) && q.options) {
      const picked = Array.isArray(value) ? value : [String(value)];
      if (picked.some((p) => !q.options!.includes(p))) errors[q.id] = "Pilihan tidak valid.";
    }
  }
  return errors;
}

export interface RespondentIdentity {
  name: string;
  email: string;
}

export function validateRespondentIdentity(identity: RespondentIdentity): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = identity.name.trim();
  const email = identity.email.trim();

  if (!name) errors.respondentName = "Nama lengkap wajib diisi.";
  if (!email) errors.respondentEmail = "Email wajib diisi.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.respondentEmail = "Masukkan alamat email yang valid.";

  return errors;
}

export type SubmitResult =
  | { ok: true; db: Database; response: FormResponse }
  | { ok: false; reason: "inactive" | "invalid"; errors?: Record<string, string> };

export function submitResponse(
  db: Database,
  params: { formId: string; answers: Answers; respondent: RespondentIdentity },
  now = new Date(),
): SubmitResult {
  const form = db.forms.find((f) => f.id === params.formId);
  if (!form || !form.active) return { ok: false, reason: "inactive" };
  const errors = {
    ...validateRespondentIdentity(params.respondent),
    ...validateAnswers(form, params.answers),
  };
  if (Object.keys(errors).length > 0) return { ok: false, reason: "invalid", errors };
  const response: FormResponse = {
    id: uid("rsp"),
    formId: form.id,
    userId: null,
    respondentName: params.respondent.name.trim(),
    respondentEmail: params.respondent.email.trim(),
    answers: params.answers,
    submittedAt: now.toISOString(),
  };
  return { ok: true, response, db: { ...db, responses: [...db.responses, response] } };
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateCode(db: Database, length = 6): string {
  for (;;) {
    let code = "";
    for (let i = 0; i < length; i++) {
      code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
    if (!db.forms.some((f) => f.code === code)) return code;
  }
}

export function validateFormDraft(db: Database, form: Form): string | null {
  const code = normalizeCode(form.code);
  if (!form.title.trim()) return "Judul form wajib diisi.";
  if (!/^[A-Z0-9]{4,12}$/.test(code)) return "Kode form 4–12 karakter huruf/angka.";
  if (db.forms.some((f) => f.code === code && f.id !== form.id))
    return "Kode form sudah dipakai form lain.";
  if (getFormPages(form).some((page) => !page.title.trim())) return "Nama halaman wajib diisi.";
  if (
    form.questions.some(
      (question) =>
        question.pageId && !getFormPages(form).some((page) => page.id === question.pageId),
    )
  ) {
    return "Ada pertanyaan yang belum memiliki halaman.";
  }
  if (form.questions.length === 0) return "Tambahkan minimal satu pertanyaan.";
  for (const [i, q] of form.questions.entries()) {
    if (!q.label.trim()) return `Pertanyaan #${i + 1} belum punya teks.`;
    if (CHOICE_TYPES.includes(q.type)) {
      const opts = (q.options ?? []).map((o) => o.trim()).filter(Boolean);
      if (opts.length < 2) return `Pertanyaan #${i + 1} butuh minimal 2 pilihan.`;
      if (new Set(opts).size !== opts.length)
        return `Pilihan di pertanyaan #${i + 1} ada yang kembar.`;
    }
  }
  return null;
}

/* ---------------- Reporting ---------------- */

export function formatAnswer(question: Question, value: AnswerValue | undefined): string {
  if (!isAnswered(value)) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (question.type === "rating") return `${value}/${RATING_MAX}`;
  return String(value);
}

export function getRespondentName(response: FormResponse, users: User[]): string {
  const user = response.userId ? users.find((item) => item.id === response.userId) : undefined;
  return response.respondentName.trim() || user?.name || "Identitas tidak tersedia (data lama)";
}

export function getRespondentEmail(response: FormResponse, users: User[]): string {
  const user = response.userId ? users.find((item) => item.id === response.userId) : undefined;
  return response.respondentEmail.trim() || user?.email || "";
}

function csvCell(value: string): string {
  const isNumeric = /^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(value);
  const safeValue = /^[\t\r ]*[=+\-@]/.test(value) && !isNumeric ? `'${value}` : value;
  if (/[",\n\r;]/.test(safeValue)) return `"${safeValue.replace(/"/g, '""')}"`;
  return safeValue;
}

export function responsesToCsv(form: Form, responses: FormResponse[], users: User[]): string {
  return responsesToRows(form, responses, users)
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
}

export function responsesToRows(form: Form, responses: FormResponse[], users: User[]): string[][] {
  const header = [
    "ID jawaban",
    "Waktu",
    "Nama responden",
    "Email",
    ...form.questions.map((q) => q.label),
  ];
  const rows = responses.map((r) => {
    return [
      r.id,
      new Date(r.submittedAt).toLocaleString("id-ID"),
      getRespondentName(r, users),
      getRespondentEmail(r, users),
      ...form.questions.map((q) => formatAnswer(q, r.answers[q.id])),
    ];
  });
  return [header, ...rows];
}

export interface ChoiceSummary {
  kind: "choice";
  counts: { option: string; count: number }[];
  total: number;
}
export interface RatingSummary {
  kind: "rating";
  average: number;
  counts: { option: string; count: number }[];
  total: number;
}
export interface TextSummary {
  kind: "text";
  samples: string[];
  total: number;
}
export type QuestionSummary = ChoiceSummary | RatingSummary | TextSummary;

export function summarizeQuestion(question: Question, responses: FormResponse[]): QuestionSummary {
  const values = responses.map((r) => r.answers[question.id]).filter(isAnswered);
  if (CHOICE_TYPES.includes(question.type)) {
    const counts = (question.options ?? []).map((option) => ({
      option,
      count: values.filter((v) => (Array.isArray(v) ? v.includes(option) : v === option)).length,
    }));
    return { kind: "choice", counts, total: values.length };
  }
  if (question.type === "rating") {
    const nums = values.map(Number);
    const counts = Array.from({ length: RATING_MAX }, (_, i) => ({
      option: `${i + 1}★`,
      count: nums.filter((n) => n === i + 1).length,
    }));
    const average = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
    return { kind: "rating", average, counts, total: nums.length };
  }
  return { kind: "text", samples: values.map(String).slice(-6).reverse(), total: values.length };
}
