/**
 * Tâche planifiée du Cabinet Cérès (toutes les 15 minutes) :
 *
 *  1. Statistiques anonymes : chaque demande de rappel est comptée UNE fois dans
 *     `stats_daily/{AAAA-MM-JJ}` (jour de dépôt, heure de Paris) – type de prise en charge,
 *     créneau, heure de dépôt, puis traitement et délai de traitement. Ces compteurs ne
 *     contiennent aucune donnée personnelle et survivent à la purge.
 *  2. Disponibilité du site : lecture des résultats du test de disponibilité Cloud Monitoring
 *     (infra/terraform/monitoring.tf) pour aujourd'hui et hier.
 *  3. Purge RGPD : suppression des demandes créées il y a plus de 14 jours (en attente OU
 *     traitées), soit une conservation maximale de 14 jours (+ 15 min au pire).
 *
 * Les constantes doivent rester alignées avec src/lib/callback-requests.ts et src/lib/stats.ts.
 */
import { setGlobalOptions } from "firebase-functions/v2";
import * as logger from "firebase-functions/logger";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, Timestamp, type Firestore } from "firebase-admin/firestore";

initializeApp();

setGlobalOptions({
  region: "europe-west1",
  maxInstances: 1,
});

const CALLBACK_COLLECTION = "callbackRequests";
const STATS_DAILY_COLLECTION = "stats_daily";
const STATS_META_DOC = "stats_meta/current";
const RETENTION_DAYS = 14;
const BATCH_SIZE = 400;
const TIME_ZONE = "Europe/Paris";

// Adresse complète du compte de service (et non l'abréviation « purge-function@ ») :
// Cloud Scheduler l'utilise telle quelle pour signer l'appel de la fonction et rejette
// une adresse incomplète (« 400 Request contains an invalid argument »).
const PROJECT_ID = process.env.GCLOUD_PROJECT ?? "cabinet-ceres";
const PURGE_SERVICE_ACCOUNT = `purge-function@${PROJECT_ID}.iam.gserviceaccount.com`;
// Hôte surveillé par le test de disponibilité (aligné avec infra/terraform/monitoring.tf).
const SITE_HOST = process.env.SITE_HOST ?? `web--${PROJECT_ID}.europe-west4.hosted.app`;

// --- Dates à l'heure de Paris -------------------------------------------------------------

const dayFormatter = new Intl.DateTimeFormat("fr-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const hourFormatter = new Intl.DateTimeFormat("fr-FR", { timeZone: TIME_ZONE, hour: "2-digit", hourCycle: "h23" });

/** « 2026-10-09 » (jour calendaire à Paris). */
function parisDay(date: Date): string {
  return dayFormatter.format(date);
}

/** « 08 » (heure à Paris, 00–23). */
function parisHour(date: Date): string {
  return hourFormatter.format(date).replace(/\D/g, "").padStart(2, "0");
}

// --- 1. Statistiques ----------------------------------------------------------------------

type StatsFlags = { created?: boolean; processed?: boolean };

/**
 * Compte chaque demande une seule fois (drapeau `_stats` posé sur le document via le SDK
 * Admin, invisible pour les règles et l'interface). Une demande remise « à rappeler » puis
 * retraitée n'est pas recomptée.
 */
async function aggregateStats(db: Firestore): Promise<{ counted: number; processed: number }> {
  const snapshot = await db.collection(CALLBACK_COLLECTION).get();
  let counted = 0;
  let processed = 0;
  let pendingNow = 0;
  let oldestPending: Timestamp | null = null;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const createdAt = data.createdAt instanceof Timestamp ? data.createdAt : null;
    if (!createdAt) continue;
    const flags: StatsFlags = { ...(data._stats ?? {}) };
    const created = createdAt.toDate();
    const dayRef = db.collection(STATS_DAILY_COLLECTION).doc(parisDay(created));

    if (data.status === "pending") {
      pendingNow += 1;
      if (!oldestPending || createdAt.toMillis() < oldestPending.toMillis()) oldestPending = createdAt;
    }

    const update: Record<string, unknown> = {};
    if (!flags.created) {
      update.requestsTotal = FieldValue.increment(1);
      update[`byCareType.${data.careType}`] = FieldValue.increment(1);
      update[`byTimeSlot.${data.timeSlot}`] = FieldValue.increment(1);
      update[`byHour.h${parisHour(created)}`] = FieldValue.increment(1);
      flags.created = true;
      counted += 1;
    }
    if (!flags.processed && data.status === "processed" && data.processedAt instanceof Timestamp) {
      const delayMinutes = Math.max(0, Math.round((data.processedAt.toMillis() - createdAt.toMillis()) / 60_000));
      update.processedCount = FieldValue.increment(1);
      update.processingDelaySumMinutes = FieldValue.increment(delayMinutes);
      flags.processed = true;
      processed += 1;
    }
    if (Object.keys(update).length === 0) continue;

    update.updatedAt = FieldValue.serverTimestamp();
    // Lot atomique par demande : si elle vient d'être supprimée, `update` échoue et le
    // compteur n'est pas modifié non plus (elle sera simplement ignorée).
    const batch = db.batch();
    batch.update(doc.ref, { _stats: flags });
    batch.set(dayRef, unflatten(update), { merge: true });
    try {
      await batch.commit();
    } catch (error) {
      logger.warn("Demande ignorée pour les statistiques", { error: String(error) });
      if (!data._stats?.created && flags.created) counted -= 1;
      if (!data._stats?.processed && flags.processed) processed -= 1;
    }
  }

  await db.doc(STATS_META_DOC).set(
    { updatedAt: FieldValue.serverTimestamp(), pendingNow, oldestPendingCreatedAt: oldestPending },
    { merge: true },
  );
  return { counted, processed };
}

/**
 * `set(..., { merge: true })` n'interprète pas les chemins pointés : on reconstruit des
 * objets imbriqués ({ "byCareType.domicile": x } → { byCareType: { domicile: x } }).
 */
function unflatten(flat: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [path, value] of Object.entries(flat)) {
    const keys = path.split(".");
    let node = out;
    keys.slice(0, -1).forEach((k) => {
      node[k] = (node[k] as Record<string, unknown>) ?? {};
      node = node[k] as Record<string, unknown>;
    });
    node[keys[keys.length - 1]] = value;
  }
  return out;
}

// --- 2. Disponibilité (Cloud Monitoring) --------------------------------------------------

type Point = { interval: { startTime: string; endTime: string }; value: { doubleValue?: number } };

async function queryHourly(metric: string, aligner: string, start: Date, end: Date): Promise<Point[]> {
  const token = await applicationDefault().getAccessToken();
  const params = new URLSearchParams({
    filter: `metric.type="monitoring.googleapis.com/uptime_check/${metric}" AND resource.type="uptime_url" AND resource.label.host="${SITE_HOST}"`,
    "interval.startTime": start.toISOString(),
    "interval.endTime": end.toISOString(),
    "aggregation.alignmentPeriod": "3600s",
    "aggregation.perSeriesAligner": aligner,
    "aggregation.crossSeriesReducer": "REDUCE_MEAN",
  });
  const response = await fetch(
    `https://monitoring.googleapis.com/v3/projects/${PROJECT_ID}/timeSeries?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token.access_token}` } },
  );
  if (!response.ok) throw new Error(`Monitoring API ${response.status}: ${await response.text()}`);
  const body = (await response.json()) as { timeSeries?: { points?: Point[] }[] };
  return body.timeSeries?.[0]?.points ?? [];
}

/** Moyenne par jour (heure de Paris) des points horaires. */
function averageByDay(points: Point[]): Map<string, { sum: number; n: number }> {
  const days = new Map<string, { sum: number; n: number }>();
  for (const p of points) {
    const value = p.value.doubleValue;
    if (typeof value !== "number" || Number.isNaN(value)) continue;
    // Le point couvre l'heure qui précède endTime : on le rattache au jour de son début.
    const day = parisDay(new Date(new Date(p.interval.endTime).getTime() - 3_600_000));
    const entry = days.get(day) ?? { sum: 0, n: 0 };
    entry.sum += value;
    entry.n += 1;
    days.set(day, entry);
  }
  return days;
}

/**
 * Recalcule (de façon idempotente) la disponibilité d'aujourd'hui et d'hier.
 * Le jour d'hier est définitif dès minuit passé.
 */
async function refreshUptime(db: Firestore): Promise<void> {
  const end = new Date();
  const start = new Date(end.getTime() - 50 * 3_600_000); // couvre toujours hier entièrement
  const [passed, latency] = await Promise.all([
    queryHourly("check_passed", "ALIGN_FRACTION_TRUE", start, end),
    queryHourly("request_latency", "ALIGN_MEAN", start, end),
  ]);
  const uptime = averageByDay(passed);
  const latencyByDay = averageByDay(latency);
  const yesterday = parisDay(new Date(end.getTime() - 24 * 3_600_000));
  const today = parisDay(end);

  const batch = db.batch();
  for (const day of [yesterday, today]) {
    const u = uptime.get(day);
    const l = latencyByDay.get(day);
    if (!u && !l) continue;
    batch.set(
      db.collection(STATS_DAILY_COLLECTION).doc(day),
      {
        uptime: u ? { fraction: u.sum / u.n, hours: u.n } : FieldValue.delete(),
        latencyMs: l ? Math.round(l.sum / l.n) : FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }
  await batch.commit();
}

// --- 3. Purge RGPD ------------------------------------------------------------------------

async function purgeExpired(db: Firestore): Promise<number> {
  const cutoff = Timestamp.fromMillis(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  let deleted = 0;

  // Suppression par lots (limite de 500 opérations par batch Firestore).
  for (;;) {
    const snapshot = await db
      .collection(CALLBACK_COLLECTION)
      .where("createdAt", "<", cutoff)
      .limit(BATCH_SIZE)
      .get();

    if (snapshot.empty) break;

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deleted += snapshot.size;

    if (snapshot.size < BATCH_SIZE) break;
  }

  if (deleted > 0) {
    await db
      .collection(STATS_DAILY_COLLECTION)
      .doc(parisDay(new Date()))
      .set({ purged: FieldValue.increment(deleted), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  }
  return deleted;
}

// --- Tâche planifiée ----------------------------------------------------------------------

// Le nom historique est conservé pour que le déploiement mette à jour la fonction existante.
export const purgeExpiredCallbackRequests = onSchedule(
  {
    schedule: "*/15 * * * *", // toutes les 15 minutes (syntaxe cron Unix)
    timeZone: TIME_ZONE,
    retryCount: 3,
    timeoutSeconds: 120,
    memory: "256MiB",
    // Compte de service dédié créé par Terraform (infra/terraform/functions.tf).
    serviceAccount: PURGE_SERVICE_ACCOUNT,
  },
  async () => {
    const db = getFirestore();

    // Les statistiques passent AVANT la purge pour qu'aucune demande ne soit perdue.
    const stats = await aggregateStats(db);

    // La disponibilité est secondaire : une erreur Monitoring ne doit pas bloquer la purge.
    try {
      await refreshUptime(db);
    } catch (error) {
      logger.warn("Lecture de la disponibilité impossible", { error: String(error) });
    }

    const deleted = await purgeExpired(db);

    // Journalise uniquement des volumes : aucune donnée personnelle dans les logs.
    logger.info("Tâche planifiée terminée", { ...stats, deleted });
  },
);
