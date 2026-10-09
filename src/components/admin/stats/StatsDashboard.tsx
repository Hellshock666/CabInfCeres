"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { CARE_TYPES, RETENTION_DAYS, TIME_SLOTS } from "@/lib/callback-requests";
import {
  PERIODS,
  STATS_REFRESH_MINUTES,
  WEEKDAYS,
  emptyDay,
  formatDuration,
  formatInt,
  formatMs,
  formatPercent,
  formatUptime,
  lastDays,
  longDate,
  shortDate,
  summarize,
  type DailyStats,
  type StatsMeta,
} from "@/lib/stats";
import { ColumnChart, type Column } from "./ColumnChart";
import { ChartCard, HBarList, StatTile } from "./parts";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; byDay: Map<string, DailyStats>; meta: StatsMeta; loadedAt: Date }
  | { status: "error"; message: string };

const MAX_DAYS = Math.max(...PERIODS.map((p) => p.days));

function relative(from: Date, now: Date): string {
  return formatDuration((now.getTime() - from.getTime()) / 60_000);
}

export function StatsDashboard() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [period, setPeriod] = useState<number>(30);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const { fetchDailyStats, fetchStatsMeta } = await import("@/lib/firebase/stats");
      // Période la plus longue + période précédente (comparaison), en une seule requête.
      const from = lastDays(MAX_DAYS * 2)[0];
      const [byDay, meta] = await Promise.all([fetchDailyStats(from), fetchStatsMeta()]);
      setState({ status: "ready", byDay, meta, loadedAt: new Date() });
    } catch (error) {
      console.error(error);
      setState({ status: "error", message: "Impossible de charger les statistiques (droits insuffisants ou réseau)." });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const view = useMemo(() => {
    if (state.status !== "ready") return null;
    const pick = (keys: string[]) => keys.map((k) => state.byDay.get(k) ?? emptyDay(k));
    const days = pick(lastDays(period, state.loadedAt));
    const previous = pick(lastDays(period, state.loadedAt, period));
    return { days, current: summarize(days), previous: summarize(previous) };
  }, [state, period]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-950">Statistiques</h1>
          <p className="text-sm text-slate-500">
            Données anonymes · actualisées toutes les {STATS_REFRESH_MINUTES} minutes
            {state.status === "ready" && state.meta.updatedAt
              ? ` · dernier calcul il y a ${relative(state.meta.updatedAt, state.loadedAt)}`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div role="radiogroup" aria-label="Période" className="inline-flex rounded-full bg-slate-200/70 p-1">
            {PERIODS.map((p) => (
              <button
                key={p.days}
                type="button"
                role="radio"
                aria-checked={period === p.days}
                onClick={() => setPeriod(p.days)}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 aria-checked:bg-white aria-checked:text-brand-900 aria-checked:shadow-sm"
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          >
            <Icon name="refresh" className="size-4" />
            <span className="sr-only">Actualiser</span>
          </button>
        </div>
      </div>

      {state.status === "loading" ? (
        <p className="py-20 text-center text-slate-500" role="status">
          Chargement des statistiques…
        </p>
      ) : null}

      {state.status === "error" ? (
        <p role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {state.message}
        </p>
      ) : null}

      {state.status === "ready" && view ? (
        <Content view={view} meta={state.meta} now={state.loadedAt} period={period} />
      ) : null}
    </div>
  );
}

function Content({
  view: { days, current, previous },
  meta,
  now,
  period,
}: {
  view: { days: DailyStats[]; current: ReturnType<typeof summarize>; previous: ReturnType<typeof summarize> };
  meta: StatsMeta;
  now: Date;
  period: number;
}) {
  const delta = current.requests - previous.requests;
  const deltaText =
    previous.requests === 0 && current.requests === 0
      ? "Aucune demande sur la période précédente"
      : `${delta >= 0 ? "+" : "−"}${formatInt(Math.abs(delta))} par rapport aux ${period} jours précédents`;

  const dailyColumns: Column[] = days.map((d) => ({
    key: d.day,
    label: shortDate(d.day),
    value: d.requestsTotal,
    tooltip: [
      longDate(d.day),
      `${formatInt(d.requestsTotal)} demande${d.requestsTotal > 1 ? "s" : ""}`,
      `${formatInt(d.processedCount)} traitée${d.processedCount > 1 ? "s" : ""}`,
      ...(d.processedCount > 0
        ? [`Délai moyen : ${formatDuration(d.processingDelaySumMinutes / d.processedCount)}`]
        : []),
    ],
  }));

  const hourColumns: Column[] = current.byHour.map((v, h) => ({
    key: `h${h}`,
    label: `${h}h`,
    value: v,
    tooltip: [`${h}h – ${h + 1}h`, `${formatInt(v)} demande${v > 1 ? "s" : ""}`],
  }));

  const weekdayColumns: Column[] = current.byWeekday.map((v, i) => ({
    key: WEEKDAYS[i],
    label: WEEKDAYS[i],
    value: v,
    tooltip: [WEEKDAYS[i], `${formatInt(v)} demande${v > 1 ? "s" : ""}`],
  }));

  const measured = days.filter((d) => d.latencyMs !== null || d.uptime !== null);
  const latencyColumns: Column[] = days.map((d) => ({
    key: d.day,
    label: shortDate(d.day),
    value: d.latencyMs ?? 0,
    tooltip: [
      longDate(d.day),
      d.uptime ? `Disponibilité : ${formatUptime(d.uptime.fraction)}` : "Pas de mesure",
      ...(d.latencyMs !== null ? [`Temps de réponse : ${formatMs(d.latencyMs)}`] : []),
    ],
  }));

  return (
    <div className="mt-6 space-y-4">
      {/* Chiffres clés */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="col-span-2 lg:row-span-2">
          <StatTile hero label="Demandes de rappel reçues" value={formatInt(current.requests)} detail={deltaText} />
        </div>
        <StatTile
          label="Taux de traitement"
          value={formatPercent(current.processingRate)}
          detail={`${formatInt(current.processed)} demande${current.processed > 1 ? "s" : ""} marquée${current.processed > 1 ? "s" : ""} « traitée »`}
        />
        <StatTile
          label="Délai moyen de traitement"
          value={formatDuration(current.avgDelayMinutes)}
          detail="Entre la demande et son passage en « traitée »"
        />
        <StatTile
          label="En attente maintenant"
          value={formatInt(meta.pendingNow)}
          detail={
            meta.oldestPendingCreatedAt
              ? `Plus ancienne : il y a ${relative(meta.oldestPendingCreatedAt, now)}`
              : "Aucune demande en attente"
          }
        />
        <StatTile
          label="Disponibilité du site"
          value={formatUptime(current.uptime)}
          detail={
            current.uptimeHours > 0
              ? `Mesurée ${formatInt(current.uptimeHours)} h depuis 3 régions`
              : "Mesure en cours de démarrage"
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatTile label="Temps de réponse moyen" value={formatMs(current.latencyMs)} detail="Page d'accueil, test toutes les 5 min" />
        <StatTile
          label="Créneau préféré"
          value={
            current.requests === 0
              ? "—"
              : current.byTimeSlot.matin >= current.byTimeSlot["apres-midi"]
                ? "Matin"
                : "Après-midi"
          }
          detail={`${formatPercent(current.requests ? current.byTimeSlot.matin / current.requests : null)} matin · ${formatPercent(current.requests ? current.byTimeSlot["apres-midi"] / current.requests : null)} après-midi`}
        />
        <StatTile
          wide
          label="Purges RGPD"
          value={formatInt(current.purged)}
          detail={`Demandes supprimées automatiquement après ${RETENTION_DAYS} jours`}
        />
      </div>

      {/* Graphiques */}
      <ChartCard
        title="Demandes reçues par jour"
        subtitle={`${period} derniers jours · jour de dépôt (heure de Paris)`}
        table={{
          headers: ["Jour", "Demandes", "Traitées", "Délai moyen"],
          rows: [...days].reverse().map((d) => [
            longDate(d.day),
            d.requestsTotal,
            d.processedCount,
            d.processedCount ? formatDuration(d.processingDelaySumMinutes / d.processedCount) : "—",
          ]),
        }}
      >
        <ColumnChart columns={dailyColumns} ariaLabel={`Demandes reçues par jour sur ${period} jours`} />
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Type de prise en charge"
          table={{
            headers: ["Type", "Demandes"],
            rows: CARE_TYPES.map((c) => [c.label, current.byCareType[c.value]]),
          }}
        >
          <HBarList items={CARE_TYPES.map((c) => ({ key: c.value, label: c.label, value: current.byCareType[c.value] }))} />
        </ChartCard>

        <ChartCard
          title="Créneau de rappel souhaité"
          table={{
            headers: ["Créneau", "Demandes"],
            rows: TIME_SLOTS.map((t) => [t.label, current.byTimeSlot[t.value]]),
          }}
        >
          <HBarList items={TIME_SLOTS.map((t) => ({ key: t.value, label: t.label, value: current.byTimeSlot[t.value] }))} />
        </ChartCard>

        <ChartCard
          title="Heure de dépôt des demandes"
          subtitle="Quand les patients remplissent le formulaire"
          table={{ headers: ["Heure", "Demandes"], rows: hourColumns.map((c) => [c.tooltip[0], c.value]) }}
        >
          <ColumnChart columns={hourColumns} ariaLabel="Demandes par heure de dépôt" minLabelSpacing={30} />
        </ChartCard>

        <ChartCard
          title="Jour de la semaine"
          table={{ headers: ["Jour", "Demandes"], rows: weekdayColumns.map((c) => [c.label, c.value]) }}
        >
          <ColumnChart columns={weekdayColumns} ariaLabel="Demandes par jour de la semaine" />
        </ChartCard>
      </div>

      <ChartCard
        title="Temps de réponse du site par jour"
        subtitle="Moyenne des tests de disponibilité · la disponibilité du jour est dans l'infobulle et le tableau"
        table={{
          headers: ["Jour", "Disponibilité", "Temps de réponse"],
          rows: [...measured].reverse().map((d) => [
            longDate(d.day),
            d.uptime ? formatUptime(d.uptime.fraction) : "—",
            formatMs(d.latencyMs),
          ]),
        }}
      >
        {measured.length > 0 ? (
          <ColumnChart columns={latencyColumns} ariaLabel="Temps de réponse moyen par jour" formatValue={(v) => formatMs(v)} />
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">
            Les premières mesures apparaîtront dans l&apos;heure qui suit la mise en place du test.
          </p>
        )}
      </ChartCard>

      <p className="text-xs text-slate-500">
        Les compteurs ne contiennent aucune donnée personnelle et sont conservés au-delà de la purge RGPD. Une
        demande supprimée manuellement moins de {STATS_REFRESH_MINUTES} minutes après son dépôt peut ne pas être
        comptée.
      </p>
    </div>
  );
}
