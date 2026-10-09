/**
 * Statistiques anonymes du site (page /admin/stats, réservée au propriétaire).
 * Les compteurs sont écrits par la fonction planifiée (functions/src/index.ts) : un document
 * par jour (heure de Paris) dans `stats_daily/{AAAA-MM-JJ}`, sans aucune donnée personnelle.
 */
import { CARE_TYPES, TIME_SLOTS, type CareType, type TimeSlot } from "@/lib/callback-requests";

export const STATS_DAILY_COLLECTION = "stats_daily";
export const STATS_META_COLLECTION = "stats_meta";
export const STATS_META_DOC_ID = "current";
export const STATS_REFRESH_MINUTES = 15;
export const TIME_ZONE = "Europe/Paris";

export interface DailyStats {
  /** AAAA-MM-JJ (jour de dépôt, heure de Paris). */
  day: string;
  requestsTotal: number;
  byCareType: Record<CareType, number>;
  byTimeSlot: Record<TimeSlot, number>;
  /** Clés « h00 » … « h23 ». */
  byHour: Record<string, number>;
  processedCount: number;
  processingDelaySumMinutes: number;
  purged: number;
  /** Part des tests de disponibilité réussis (0–1) et nombre d'heures mesurées. */
  uptime: { fraction: number; hours: number } | null;
  latencyMs: number | null;
}

export interface StatsMeta {
  updatedAt: Date | null;
  pendingNow: number;
  oldestPendingCreatedAt: Date | null;
}

export const PERIODS = [
  { days: 7, label: "7 jours" },
  { days: 30, label: "30 jours" },
  { days: 90, label: "90 jours" },
] as const;

export const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] as const;

// --- Jours (heure de Paris) ---------------------------------------------------------------

const dayFormatter = new Intl.DateTimeFormat("fr-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function parisDay(date: Date): string {
  return dayFormatter.format(date);
}

function keyToUtc(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Les `count` derniers jours (le plus ancien d'abord), décalés de `offset` jours. */
export function lastDays(count: number, now = new Date(), offset = 0): string[] {
  const today = keyToUtc(parisDay(now)).getTime();
  return Array.from({ length: count }, (_, i) =>
    new Date(today - (count - 1 - i + offset) * 86_400_000).toISOString().slice(0, 10),
  );
}

/** 0 = lundi … 6 = dimanche. */
export function weekdayIndex(key: string): number {
  return (keyToUtc(key).getUTCDay() + 6) % 7;
}

export function shortDate(key: string): string {
  const [, m, d] = key.split("-");
  return `${d}/${m}`;
}

export function longDate(key: string): string {
  return keyToUtc(key).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}

// --- Normalisation ------------------------------------------------------------------------

const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);

export function emptyDay(day: string): DailyStats {
  return {
    day,
    requestsTotal: 0,
    byCareType: Object.fromEntries(CARE_TYPES.map((c) => [c.value, 0])) as Record<CareType, number>,
    byTimeSlot: Object.fromEntries(TIME_SLOTS.map((t) => [t.value, 0])) as Record<TimeSlot, number>,
    byHour: {},
    processedCount: 0,
    processingDelaySumMinutes: 0,
    purged: 0,
    uptime: null,
    latencyMs: null,
  };
}

/** Convertit un document Firestore brut en `DailyStats` (champs manquants = 0). */
export function parseDailyStats(day: string, raw: Record<string, unknown>): DailyStats {
  const base = emptyDay(day);
  const care = (raw.byCareType ?? {}) as Record<string, unknown>;
  const slots = (raw.byTimeSlot ?? {}) as Record<string, unknown>;
  const hours = (raw.byHour ?? {}) as Record<string, unknown>;
  const uptime = raw.uptime as { fraction?: unknown; hours?: unknown } | undefined;
  return {
    ...base,
    requestsTotal: num(raw.requestsTotal),
    byCareType: Object.fromEntries(CARE_TYPES.map((c) => [c.value, num(care[c.value])])) as Record<CareType, number>,
    byTimeSlot: Object.fromEntries(TIME_SLOTS.map((t) => [t.value, num(slots[t.value])])) as Record<TimeSlot, number>,
    byHour: Object.fromEntries(Object.entries(hours).map(([k, v]) => [k, num(v)])),
    processedCount: num(raw.processedCount),
    processingDelaySumMinutes: num(raw.processingDelaySumMinutes),
    purged: num(raw.purged),
    uptime: uptime && typeof uptime.fraction === "number" ? { fraction: uptime.fraction, hours: num(uptime.hours) } : null,
    latencyMs: typeof raw.latencyMs === "number" ? raw.latencyMs : null,
  };
}

// --- Synthèse d'une période ---------------------------------------------------------------

export interface PeriodSummary {
  requests: number;
  processed: number;
  /** null si aucune demande. */
  processingRate: number | null;
  avgDelayMinutes: number | null;
  purged: number;
  /** Disponibilité pondérée par le nombre d'heures mesurées ; null si aucune mesure. */
  uptime: number | null;
  uptimeHours: number;
  latencyMs: number | null;
  byCareType: Record<CareType, number>;
  byTimeSlot: Record<TimeSlot, number>;
  byHour: number[];
  byWeekday: number[];
}

export function summarize(days: DailyStats[]): PeriodSummary {
  const s: PeriodSummary = {
    requests: 0,
    processed: 0,
    processingRate: null,
    avgDelayMinutes: null,
    purged: 0,
    uptime: null,
    uptimeHours: 0,
    latencyMs: null,
    byCareType: emptyDay("").byCareType,
    byTimeSlot: emptyDay("").byTimeSlot,
    byHour: Array(24).fill(0),
    byWeekday: Array(7).fill(0),
  };
  let delaySum = 0;
  let uptimeWeighted = 0;
  let latencyWeighted = 0;
  let latencyHours = 0;

  for (const d of days) {
    s.requests += d.requestsTotal;
    s.processed += d.processedCount;
    s.purged += d.purged;
    delaySum += d.processingDelaySumMinutes;
    for (const c of CARE_TYPES) s.byCareType[c.value] += d.byCareType[c.value];
    for (const t of TIME_SLOTS) s.byTimeSlot[t.value] += d.byTimeSlot[t.value];
    for (let h = 0; h < 24; h++) s.byHour[h] += d.byHour[`h${String(h).padStart(2, "0")}`] ?? 0;
    s.byWeekday[weekdayIndex(d.day)] += d.requestsTotal;
    if (d.uptime && d.uptime.hours > 0) {
      uptimeWeighted += d.uptime.fraction * d.uptime.hours;
      s.uptimeHours += d.uptime.hours;
      if (d.latencyMs !== null) {
        latencyWeighted += d.latencyMs * d.uptime.hours;
        latencyHours += d.uptime.hours;
      }
    }
  }

  if (s.requests > 0) s.processingRate = s.processed / s.requests;
  if (s.processed > 0) s.avgDelayMinutes = delaySum / s.processed;
  if (s.uptimeHours > 0) s.uptime = uptimeWeighted / s.uptimeHours;
  if (latencyHours > 0) s.latencyMs = latencyWeighted / latencyHours;
  return s;
}

// --- Formats ------------------------------------------------------------------------------

const intFormat = new Intl.NumberFormat("fr-FR");

export function formatInt(n: number): string {
  return intFormat.format(Math.round(n));
}

export function formatPercent(fraction: number | null, digits = 0): string {
  if (fraction === null) return "—";
  return `${(fraction * 100).toLocaleString("fr-FR", { minimumFractionDigits: digits, maximumFractionDigits: digits })} %`;
}

/** Disponibilité : 2 décimales sous 100 % (99,95 %), sinon « 100 % ». */
export function formatUptime(fraction: number | null): string {
  if (fraction === null) return "—";
  return fraction >= 0.99995 ? "100 %" : formatPercent(fraction, 2);
}

export function formatDuration(minutes: number | null): string {
  if (minutes === null) return "—";
  const m = Math.round(minutes);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ${String(m % 60).padStart(2, "0")}`;
  const d = Math.floor(h / 24);
  return `${d} j ${h % 24} h`;
}

export function formatMs(ms: number | null): string {
  if (ms === null) return "—";
  return ms >= 1000 ? `${(ms / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} s` : `${Math.round(ms)} ms`;
}
