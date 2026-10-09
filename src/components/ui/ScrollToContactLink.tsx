"use client";

import type { MouseEvent, ReactNode } from "react";
import { CONTACT_HEADING_ID, CONTACT_SECTION_ID } from "./contact-anchor";

/**
 * Bouton « Demander un rappel » : défilement fluide vers le formulaire de contact.
 * Sans JavaScript, l'ancre #contact + `scroll-behavior: smooth` (globals.css) prennent le relais.
 */
export function ScrollToContactLink({
  children,
  className = "",
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  /** Libellé accessible, obligatoire quand le lien ne contient qu'une icône. */
  ariaLabel?: string;
}) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(CONTACT_SECTION_ID);
    if (!target) return;

    event.preventDefault();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    window.history.replaceState(null, "", `#${CONTACT_SECTION_ID}`);

    // Accessibilité : place le focus sur le titre du formulaire (sans ouvrir le clavier mobile).
    document.getElementById(CONTACT_HEADING_ID)?.focus({ preventScroll: true });
  };

  return (
    <a href={`#${CONTACT_SECTION_ID}`} onClick={handleClick} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  );
}
