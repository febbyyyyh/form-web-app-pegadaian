import { describe, expect, it, vi } from "vitest";

import {
  authenticate,
  createFormShareLink,
  getFormPages,
  getPageQuestions,
  responsesToCsv,
  submitResponse,
} from "@/lib/formkanwil/logic";
import { createInitialDatabase } from "@/lib/formkanwil/seed";
import type { Database, Form, FormResponse } from "@/lib/formkanwil/types";

describe("FormKanwil initial data", () => {
  it("starts with only the admin account and no forms or answers", () => {
    const database = createInitialDatabase();

    expect(database.users.map((user) => user.role)).toEqual(["admin"]);
    expect(database.forms).toHaveLength(0);
    expect(database.responses).toHaveLength(0);
    expect(database).not.toHaveProperty("units");
    expect(authenticate(database, "admin", "admin123")).toMatchObject({
      ok: true,
      user: { role: "admin" },
    });
  });

  it("allows only the first administrator to log in", () => {
    const database = createInitialDatabase();
    const admin = database.users[0];
    if (!admin) throw new Error("Expected an initial admin account");
    const user = {
      ...admin,
      id: "usr_user",
      username: "pengguna",
      role: "user" as const,
    };
    const extraAdmin = {
      ...admin,
      id: "usr_extra_admin",
      username: "admin-lain",
    };
    const withAccounts = { ...database, users: [...database.users, user, extraAdmin] };

    expect(authenticate(withAccounts, "admin", admin.password)).toMatchObject({ ok: true });
    expect(authenticate(withAccounts, "pengguna", admin.password)).toMatchObject({ ok: false });
    expect(authenticate(withAccounts, "admin-lain", admin.password)).toMatchObject({ ok: false });
  });

  it("exports response columns without a unit field", () => {
    const admin = createInitialDatabase().users[0];
    if (!admin) throw new Error("Expected an initial admin account");
    const form: Form = {
      id: "form-1",
      code: "FORM1",
      title: "Form",
      description: "",
      emoji: "📝",
      active: true,
      questions: [],
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
    };
    const response: FormResponse = {
      id: "response-1",
      formId: form.id,
      userId: admin.id,
      answers: {},
      submittedAt: new Date(0).toISOString(),
    };

    expect(responsesToCsv(form, [response], [admin]).split("\r\n")[0]).toBe(
      "ID jawaban,Waktu,Nama responden",
    );
  });

  it("includes response IDs and escapes spreadsheet formulas in CSV exports", () => {
    const form: Form = {
      id: "form-1",
      code: "FORM1",
      title: "Form",
      description: "",
      emoji: "📝",
      active: true,
      questions: [{ id: "question-1", type: "short", label: "Nama", required: false }],
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
    };
    const response: FormResponse = {
      id: "response-1",
      formId: form.id,
      userId: null,
      answers: { "question-1": "=SUM(1,1)" },
      submittedAt: new Date(0).toISOString(),
    };
    const csv = responsesToCsv(form, [response], []);

    expect(csv.split("\r\n")[0]).toBe("ID jawaban,Waktu,Nama responden,Nama");
    expect(csv).toContain("response-1");
    expect(csv).toContain(`"'=SUM(1,1)"`);
  });

  it("creates a code-prefilled public share link", () => {
    expect(createFormShareLink("http://localhost:8080/", " form-1 ")).toBe(
      "http://localhost:8080/app?code=FORM-1",
    );
  });

  it("accepts multiple anonymous responses for the same form", () => {
    const form: Form = {
      id: "form-1",
      code: "FORM1",
      title: "Form",
      description: "",
      emoji: "📝",
      active: true,
      questions: [],
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
    };
    const database: Database = { users: [], forms: [form], responses: [] };
    const first = submitResponse(database, { formId: form.id, answers: {} });
    if (!first.ok) throw new Error("Expected the first anonymous response to be accepted");
    const second = submitResponse(first.db, { formId: form.id, answers: {} });

    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.response.userId).toBeNull();
      expect(second.db.responses).toHaveLength(2);
    }
  });

  it("keeps login sessions in the current tab and clears the old shared session", async () => {
    localStorage.setItem("formkanwil:session:v1", "usr_admin");
    sessionStorage.clear();
    vi.resetModules();

    try {
      const { getSessionUserId, setSession } = await import("@/lib/formkanwil/store");

      expect(getSessionUserId()).toBeNull();
      setSession("usr_admin");
      expect(getSessionUserId()).toBe("usr_admin");
      expect(sessionStorage.getItem("formkanwil:session:v2")).toBe("usr_admin");
      expect(localStorage.getItem("formkanwil:session:v1")).toBeNull();
    } finally {
      localStorage.removeItem("formkanwil:session:v1");
      sessionStorage.removeItem("formkanwil:session:v2");
    }
  });

  it("keeps only one administrator when loading existing browser data", async () => {
    const database = createInitialDatabase();
    const admin = database.users[0];
    if (!admin) throw new Error("Expected an initial admin account");
    const extraAdmin = { ...admin, id: "usr_extra_admin", username: "admin-lain" };
    localStorage.setItem(
      "formkanwil:db:v5",
      JSON.stringify({ ...database, users: [...database.users, extraAdmin] }),
    );
    vi.resetModules();

    try {
      const { getDb } = await import("@/lib/formkanwil/store");
      const restored = getDb();
      const persisted = JSON.parse(localStorage.getItem("formkanwil:db:v5") ?? "null") as Database;

      expect(restored.users.filter((user) => user.role === "admin").map((user) => user.id)).toEqual(
        [admin.id],
      );
      expect(persisted).toEqual(restored);
    } finally {
      localStorage.removeItem("formkanwil:db:v5");
    }
  });

  it("removes unit data from existing local accounts without deleting collected data", async () => {
    const initialDatabase = createInitialDatabase();
    const createForm = (id: string): Form => ({
      id,
      code: id,
      title: id,
      description: "",
      emoji: "📝",
      active: false,
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
      questions: [],
    });
    const createResponse = (formId: string): FormResponse => ({
      id: `${formId}_response`,
      formId,
      userId: "usr_old",
      answers: {},
      submittedAt: new Date(0).toISOString(),
    });
    const legacyDatabase = {
      ...initialDatabase,
      users: [
        ...initialDatabase.users.map((user) => ({ ...user, unit: "" })),
        {
          id: "usr_old",
          username: "old-user",
          password: "old-password",
          name: "Pengguna Lama",
          email: "old@kanwil.pegadaian.co.id",
          unit: "Unit Lama",
          role: "user" as const,
          active: true,
          createdAt: new Date(0).toISOString(),
        },
      ],
      units: ["Unit Lama"],
      forms: [createForm("frm_old")],
      responses: [createResponse("frm_old")],
    };
    localStorage.setItem("formkanwil:db:v2", JSON.stringify(legacyDatabase));
    localStorage.setItem("formkanwil:db:v3", JSON.stringify(legacyDatabase));
    localStorage.setItem("formkanwil:db:v4", JSON.stringify(legacyDatabase));

    vi.resetModules();
    try {
      const { getDb } = await import("@/lib/formkanwil/store");
      const restored = getDb();
      const persisted = JSON.parse(localStorage.getItem("formkanwil:db:v5") ?? "null") as Database;

      expect(restored.users.map((user) => user.username)).toEqual(["admin", "old-user"]);
      expect(restored.forms.map((form) => form.id)).toEqual(["frm_old"]);
      expect(restored.responses.map((response) => response.id)).toEqual(["frm_old_response"]);
      expect(restored.users.every((user) => !("unit" in user))).toBe(true);
      expect(persisted).not.toHaveProperty("units");
      expect(localStorage.getItem("formkanwil:db:v2")).toBeNull();
      expect(localStorage.getItem("formkanwil:db:v3")).toBeNull();
      expect(localStorage.getItem("formkanwil:db:v4")).toBeNull();
      expect(persisted).toEqual(restored);
    } finally {
      localStorage.removeItem("formkanwil:db:v2");
      localStorage.removeItem("formkanwil:db:v3");
      localStorage.removeItem("formkanwil:db:v4");
      localStorage.removeItem("formkanwil:db:v5");
    }
  });

  it("supports page-specific questions and legacy single-page forms", () => {
    const pageOne = { id: "page-one", title: "Data diri" };
    const pageTwo = { id: "page-two", title: "Informasi lain" };
    const form: Form = {
      id: "form-1",
      code: "FORM1",
      title: "Form",
      description: "",
      emoji: "📝",
      active: false,
      pages: [pageOne, pageTwo],
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
      questions: [
        { id: "question-1", type: "short", label: "Nama", required: true, pageId: pageOne.id },
        { id: "question-2", type: "short", label: "Kontak", required: true, pageId: pageTwo.id },
      ],
    };

    expect(getFormPages(form)).toEqual([pageOne, pageTwo]);
    expect(getPageQuestions(form, pageOne.id)).toEqual([form.questions[0]]);
    expect(getPageQuestions(form, pageTwo.id)).toEqual([form.questions[1]]);

    delete form.pages;
    form.questions.forEach((question) => delete question.pageId);
    const [legacyPage] = getFormPages(form);
    if (!legacyPage) throw new Error("Expected a default form page");
    expect(getPageQuestions(form, legacyPage.id)).toEqual(form.questions);
  });
});
