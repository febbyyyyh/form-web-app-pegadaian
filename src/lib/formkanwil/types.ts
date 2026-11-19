export type Role = "admin" | "user";

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  email: string;
  unit: string;
  tagline?: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export type QuestionType =
  | "short"
  | "long"
  | "single"
  | "multiple"
  | "dropdown"
  | "rating"
  | "number"
  | "date";

export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  help?: string;
  required: boolean;
  options?: string[];
}

export interface Form {
  id: string;
  code: string;
  title: string;
  description: string;
  emoji: string;
  active: boolean;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

export type AnswerValue = string | string[] | number;
export type Answers = Record<string, AnswerValue | undefined>;

export interface FormResponse {
  id: string;
  formId: string;
  userId: string;
  answers: Answers;
  submittedAt: string;
}

export interface Database {
  version: 1;
  users: User[];
  units: string[];
  forms: Form[];
  responses: FormResponse[];
}

export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  short: "Jawaban singkat",
  long: "Paragraf",
  single: "Pilihan ganda",
  multiple: "Kotak centang",
  dropdown: "Dropdown",
  rating: "Rating bintang",
  number: "Angka",
  date: "Tanggal",
};

export const CHOICE_TYPES: QuestionType[] = ["single", "multiple", "dropdown"];
