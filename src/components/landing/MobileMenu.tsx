"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { mainNav } from "@/config/navigation";
import { Icon } from "@/components/ui/Icon";

/** Menu « hamburger » des écrans < lg. */
export function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="menu-mobile"
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-11 items-center justify-center rounded-full text-brand-800 hover:bg-brand-50"
      >
        <Icon name={open ? "close" : "menu"} className="size-7" />
      </button>

      {open ? (
        <nav
          id="menu-mobile"
          aria-label="Navigation principale"
          className="absolute inset-x-0 top-full border-b border-slate-200 bg-white shadow-lg"
        >
          <ul className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-slate-100 py-3.5 text-base font-medium text-brand-900 last:border-0"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
