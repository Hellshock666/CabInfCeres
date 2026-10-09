/**
 * Lecture des statistiques (réservée au rôle `owner` par firestore.rules).
 */
import { collection, doc, documentId, getDoc, getDocs, query, where, type Timestamp } from "firebase/firestore";
import {
  STATS_DAILY_COLLECTION,
  STATS_META_COLLECTION,
  STATS_META_DOC_ID,
  parseDailyStats,
  type DailyStats,
  type StatsMeta,
} from "@/lib/stats";
import { getDb } from "./client";

/** Documents journaliers à partir du jour `fromKey` inclus (AAAA-MM-JJ), indexés par jour. */
export async function fetchDailyStats(fromKey: string): Promise<Map<string, DailyStats>> {
  const snapshot = await getDocs(
    query(collection(getDb(), STATS_DAILY_COLLECTION), where(documentId(), ">=", fromKey)),
  );
  return new Map(snapshot.docs.map((d) => [d.id, parseDailyStats(d.id, d.data())]));
}

export async function fetchStatsMeta(): Promise<StatsMeta> {
  const snapshot = await getDoc(doc(getDb(), STATS_META_COLLECTION, STATS_META_DOC_ID));
  const data = snapshot.data() ?? {};
  return {
    updatedAt: (data.updatedAt as Timestamp | undefined)?.toDate() ?? null,
    pendingNow: typeof data.pendingNow === "number" ? data.pendingNow : 0,
    oldestPendingCreatedAt: (data.oldestPendingCreatedAt as Timestamp | null | undefined)?.toDate() ?? null,
  };
}
