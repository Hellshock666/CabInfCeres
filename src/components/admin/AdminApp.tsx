"use client";

import { AdminShell } from "./AdminShell";
import { Dashboard } from "./Dashboard";

/** Espace infirmiers : demandes de rappel (rôle `nurse`). */
export function AdminApp() {
  return <AdminShell section="requests">{(user) => <Dashboard userEmail={user.email ?? ""} />}</AdminShell>;
}
