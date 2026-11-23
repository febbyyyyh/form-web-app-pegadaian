import type { Database } from "./types";

export function createInitialDatabase(): Database {
  return {
    version: 1,
    users: [
      {
        id: "usr_admin",
        username: "admin",
        password: "admin123",
        name: "Admin Kanwil",
        email: "admin@kanwil.pegadaian.co.id",
        role: "admin",
        active: true,
        createdAt: new Date().toISOString(),
      },
    ],
    forms: [],
    responses: [],
  };
}
