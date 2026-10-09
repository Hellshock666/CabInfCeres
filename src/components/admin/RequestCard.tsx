"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  formatFrenchPhone,
  labelForCareType,
  labelForTimeSlot,
  purgeDateFor,
  type CallbackRequest,
} from "@/lib/callback-requests";

const dateTimeFormat = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const dateFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });
const relativeFormat = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

function relativeTime(date: Date, now: number): string {
  const minutes = Math.round((date.getTime() - now) / 60_000);
  if (Math.abs(minutes) < 60) return relativeFormat.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relativeFormat.format(hours, "hour");
  return relativeFormat.format(Math.round(hours / 24), "day");
}

type Action = "process" | "reopen" | "delete";

export function RequestCard({ request, now }: { request: CallbackRequest; now: number }) {
  const [busy, setBusy] = useState<Action | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: Action) {
    setBusy(action);
    setError(null);
    try {
      const api = await import("@/lib/firebase/callback-requests");
      if (action === "process") await api.markAsProcessed(request.id);
      if (action === "reopen") await api.markAsPending(request.id);
      if (action === "delete") await api.deleteCallbackRequest(request.id);
    } catch (err) {
      console.error(err);
      setError("L'action a échoué. Réessayez.");
      setBusy(null);
    }
    // En cas de succès, la carte est mise à jour ou retirée par l'écoute temps réel.
    if (action !== "delete") setBusy(null);
  }

  const isPending = request.status === "pending";

  return (
    <article
      className={`rounded-2xl border bg-white p-4 shadow-sm sm:p-5 ${isPending ? "border-brand-200" : "border-slate-200 opacity-80"}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-slate-900">{request.fullName}</h2>
          <a
            href={`tel:${request.phone}`}
            className="mt-1 inline-flex items-center gap-2 text-base font-semibold text-brand-700 tabular-nums hover:underline"
          >
            <Icon name="phone" className="size-4" />
            {formatFrenchPhone(request.phone)}
          </a>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-brand-800">{labelForCareType(request.careType)}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
              <Icon name="clock" className="size-3.5" />
              Rappel : {labelForTimeSlot(request.timeSlot).toLowerCase()}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end">
          {isPending ? (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void run("process")}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              <Icon name="check" className="size-4" />
              {busy === "process" ? "…" : "Marquer traitée"}
            </button>
          ) : (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void run("reopen")}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <Icon name="undo" className="size-4" />
              Remettre en attente
            </button>
          )}

          {confirmDelete ? (
            <span className="inline-flex items-center gap-2">
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void run("delete")}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {busy === "delete" ? "Suppression…" : "Confirmer la suppression"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-sm text-slate-600 hover:underline"
              >
                Annuler
              </button>
            </span>
          ) : (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              <Icon name="trash" className="size-4" />
              Supprimer
            </button>
          )}
        </div>
      </div>

      <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
        {request.createdAt ? (
          <>
            Reçue {relativeTime(request.createdAt, now)} ({dateTimeFormat.format(request.createdAt)}) · suppression
            automatique le {dateFormat.format(purgeDateFor(request.createdAt))}
          </>
        ) : (
          "Envoi en cours…"
        )}
        {request.processedAt ? <> · traitée le {dateTimeFormat.format(request.processedAt)}</> : null}
      </p>

      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </article>
  );
}
