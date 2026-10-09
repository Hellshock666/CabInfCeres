"use client";

import { useState, type FormEvent } from "react";

const ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Adresse e-mail ou mot de passe incorrect.",
  "auth/invalid-email": "Adresse e-mail invalide.",
  "auth/user-disabled": "Ce compte a été désactivé.",
  "auth/too-many-requests": "Trop de tentatives. Réessayez dans quelques minutes.",
  "auth/network-request-failed": "Problème de connexion réseau.",
};

const inputClass =
  "mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base shadow-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus:outline-none";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [email, setEmail] = useState("");

  async function loadAuth() {
    const [authModule, { getAuthClient }] = await Promise.all([
      import("firebase/auth"),
      import("@/lib/firebase/client"),
    ]);
    return { ...authModule, auth: getAuthClient() };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    setPending(true);
    setError(null);
    setInfo(null);
    try {
      const { signInWithEmailAndPassword, auth } = await loadAuth();
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      setError(ERROR_MESSAGES[code] ?? "Connexion impossible. Réessayez.");
    } finally {
      setPending(false);
    }
  }

  async function handleResetPassword() {
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError("Saisissez d'abord votre adresse e-mail.");
      return;
    }
    try {
      const { sendPasswordResetEmail, auth } = await loadAuth();
      await sendPasswordResetEmail(auth, email.trim());
    } catch {
      // Message identique en cas d'erreur pour ne pas révéler l'existence d'un compte.
    }
    setInfo("Si un compte existe pour cette adresse, un e-mail de réinitialisation vient d'être envoyé.");
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold text-brand-950">Connexion</h1>
      <p className="mt-1 text-sm text-slate-500">Accès réservé aux infirmiers du cabinet.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label htmlFor="email" className="text-sm font-medium text-slate-800">
            Adresse e-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-medium text-slate-800">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={inputClass}
          />
        </div>

        {error ? (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {info ? (
          <p role="status" className="rounded-lg bg-brand-50 p-3 text-sm text-brand-800">
            {info}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-70"
        >
          {pending ? "Connexion…" : "Se connecter"}
        </button>
        <button
          type="button"
          onClick={() => void handleResetPassword()}
          className="w-full text-center text-sm text-brand-700 hover:underline"
        >
          Mot de passe oublié ?
        </button>
      </form>
    </div>
  );
}
