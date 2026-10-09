"use client";

import { useEffect, useMemo, useState } from "react";
import { RETENTION_DAYS, type CallbackRequest, type RequestStatus } from "@/lib/callback-requests";
import { RequestCard } from "./RequestCard";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; requests: CallbackRequest[] }
  | { status: "error"; message: string };

const TABS: { value: RequestStatus; label: string }[] = [
  { value: "pending", label: "À rappeler" },
  { value: "processed", label: "Traitées" },
];

export function Dashboard({ userEmail }: { userEmail: string }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [tab, setTab] = useState<RequestStatus>("pending");
  const [now, setNow] = useState(() => Date.now());

  // Écoute temps réel de Firestore.
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    import("@/lib/firebase/callback-requests").then(({ subscribeToCallbackRequests }) => {
      if (cancelled) return;
      unsubscribe = subscribeToCallbackRequests(
        (requests) => setState({ status: "ready", requests }),
        (error) => {
          console.error(error);
          setState({ status: "error", message: "Impossible de charger les demandes (droits insuffisants ou réseau)." });
        },
      );
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  // Rafraîchit les durées relatives (« il y a 5 min ») chaque minute.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const counts = useMemo(() => {
    const requests = state.status === "ready" ? state.requests : [];
    return {
      pending: requests.filter((r) => r.status === "pending").length,
      processed: requests.filter((r) => r.status === "processed").length,
    };
  }, [state]);

  const visible = useMemo(() => {
    if (state.status !== "ready") return [];
    const filtered = state.requests.filter((r) => r.status === tab);
    // Les plus anciennes demandes en attente d'abord (à traiter en priorité).
    return tab === "pending" ? [...filtered].reverse() : filtered;
  }, [state, tab]);

  return (
    <div>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-950">Demandes de rappel</h1>
          <p className="text-sm text-slate-500">Connectée : {userEmail}</p>
        </div>
        <p className="text-xs text-slate-500">
          Suppression automatique après {RETENTION_DAYS} jours · mise à jour en temps réel
        </p>
      </div>

      <div role="tablist" aria-label="Filtrer les demandes" className="mt-6 inline-flex rounded-full bg-slate-200/70 p-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.value ? "bg-white text-brand-800 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t.label}
            <span
              className={`ml-2 inline-flex min-w-6 justify-center rounded-full px-1.5 text-xs ${
                t.value === "pending" && counts.pending > 0 ? "bg-brand-600 text-white" : "bg-slate-300/70 text-slate-700"
              }`}
            >
              {counts[t.value]}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6">
        {state.status === "loading" ? (
          <p role="status" className="py-16 text-center text-slate-500">
            Chargement des demandes…
          </p>
        ) : null}

        {state.status === "error" ? (
          <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {state.message}
          </p>
        ) : null}

        {state.status === "ready" && visible.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">
            {tab === "pending" ? "Aucune demande en attente." : "Aucune demande traitée."}
          </p>
        ) : null}

        {visible.length > 0 ? (
          <ul className="grid gap-3">
            {visible.map((request) => (
              <li key={request.id}>
                <RequestCard request={request} now={now} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
