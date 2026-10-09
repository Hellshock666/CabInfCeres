"use client";

import { useEffect } from "react";

/** Enregistre le service worker (production uniquement, pour ne pas gêner le rechargement à chaud). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // Échec silencieux : le site fonctionne normalement sans service worker.
      });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
