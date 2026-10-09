"use client";

import Link from "next/link";
import { LogoMark } from "@/components/ui/LogoMark";
import { Icon } from "@/components/ui/Icon";
import { Dashboard } from "./Dashboard";
import { LoginForm } from "./LoginForm";
import { signOutNurse, useNurseAuth } from "./useNurseAuth";

export function AdminApp() {
  const auth = useNurseAuth();

  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark className="size-8" />
            <span className="leading-tight">
              <span className="block text-sm font-bold text-brand-900">Cabinet Cérès</span>
              <span className="block text-xs text-slate-500">Espace infirmiers</span>
            </span>
          </Link>
          {auth.status === "nurse" || auth.status === "forbidden" ? (
            <button
              type="button"
              onClick={() => void signOutNurse()}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <Icon name="logOut" className="size-4" />
              <span className="hidden sm:inline">Se déconnecter</span>
            </button>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {auth.status === "loading" ? (
          <p className="py-20 text-center text-slate-500" role="status">
            Chargement…
          </p>
        ) : null}

        {auth.status === "signedOut" ? <LoginForm /> : null}

        {auth.status === "forbidden" ? (
          <div role="alert" className="mx-auto max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
            <p className="font-semibold">Accès non autorisé</p>
            <p className="mt-2 text-sm">
              Le compte {auth.user.email} n&apos;est pas habilité à consulter les demandes. Contactez
              l&apos;administrateur du cabinet.
            </p>
          </div>
        ) : null}

        {auth.status === "nurse" ? <Dashboard userEmail={auth.user.email ?? ""} /> : null}
      </main>
    </>
  );
}
