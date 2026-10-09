"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/ui/LogoMark";
import { Icon, type IconName } from "@/components/ui/Icon";
import { LoginForm } from "./LoginForm";
import { signOutNurse, useStaffAuth, type StaffRoles } from "./useNurseAuth";
import type { User } from "firebase/auth";

type Section = "requests" | "stats";

const NAV: { section: Section; href: string; label: string; icon: IconName; role: keyof StaffRoles }[] = [
  { section: "requests", href: "/admin", label: "Demandes", icon: "inbox", role: "nurse" },
  { section: "stats", href: "/admin/stats", label: "Statistiques", icon: "barChart", role: "owner" },
];

/**
 * Cadre commun aux pages /admin : en-tête, navigation selon les rôles, connexion,
 * et refus d'accès si le compte n'a pas le rôle requis par la page.
 */
export function AdminShell({
  section,
  children,
}: {
  section: Section;
  children: (user: User) => ReactNode;
}) {
  const auth = useStaffAuth();
  const current = NAV.find((n) => n.section === section)!;
  const links = auth.status === "signedIn" ? NAV.filter((n) => auth.roles[n.role]) : [];
  const allowed = auth.status === "signedIn" && auth.roles[current.role];

  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <LogoMark className="size-8" />
            <span className="leading-tight">
              <span className="block text-sm font-bold text-brand-900">Cabinet Cérès</span>
              <span className="block text-xs text-slate-500">Espace privé</span>
            </span>
          </Link>

          {auth.status === "signedIn" ? (
            <div className="flex items-center gap-1 sm:gap-2">
              {links.length > 1 ? (
                <nav aria-label="Espace privé" className="flex items-center gap-1">
                  {links.map((n) => (
                    <Link
                      key={n.section}
                      href={n.href}
                      aria-current={n.section === section ? "page" : undefined}
                      className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 aria-[current=page]:bg-brand-50 aria-[current=page]:text-brand-800"
                    >
                      <Icon name={n.icon} className="size-4" />
                      <span className="hidden sm:inline">{n.label}</span>
                      <span className="sr-only sm:hidden">{n.label}</span>
                    </Link>
                  ))}
                </nav>
              ) : null}
              <button
                type="button"
                onClick={() => void signOutNurse()}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <Icon name="logOut" className="size-4" />
                <span className="hidden sm:inline">Se déconnecter</span>
                <span className="sr-only sm:hidden">Se déconnecter</span>
              </button>
            </div>
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

        {auth.status === "signedIn" && !allowed ? (
          <div role="alert" className="mx-auto max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
            <p className="font-semibold">Accès non autorisé</p>
            <p className="mt-2 text-sm">
              Le compte {auth.user.email} n&apos;est pas habilité à consulter cette page.
              {links.length > 0 ? (
                <>
                  {" "}
                  Accès disponible :{" "}
                  {links.map((n, i) => (
                    <span key={n.section}>
                      {i > 0 ? ", " : ""}
                      <Link href={n.href} className="font-semibold underline">
                        {n.label}
                      </Link>
                    </span>
                  ))}
                  .
                </>
              ) : (
                " Contactez l'administrateur du cabinet."
              )}
            </p>
          </div>
        ) : null}

        {auth.status === "signedIn" && allowed ? children(auth.user) : null}
      </main>
    </>
  );
}
