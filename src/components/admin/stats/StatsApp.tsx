"use client";

import { AdminShell } from "../AdminShell";
import { StatsDashboard } from "./StatsDashboard";

export function StatsApp() {
  return <AdminShell section="stats">{() => <StatsDashboard />}</AdminShell>;
}
