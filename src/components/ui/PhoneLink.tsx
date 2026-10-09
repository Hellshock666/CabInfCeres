import { site, telHref } from "@/config/site";
import { Icon } from "./Icon";

const ariaLabel = `Appeler le cabinet au ${site.phone.display}`;

/**
 * Bouton d'appel compact (en-tête) : lien `tel:` qui déclenche la pré-numérotation sur mobile.
 */
export function PhoneLink({ className = "" }: { className?: string }) {
  return (
    <a
      href={telHref}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2.5 rounded-lg bg-brand-700 px-5 py-3 font-semibold whitespace-nowrap text-white shadow-sm shadow-brand-900/20 transition-colors hover:bg-brand-800 ${className}`}
    >
      <Icon name="phone" className="size-5 shrink-0 fill-current stroke-none" />
      <span className="text-lg tabular-nums">{site.phone.display}</span>
    </a>
  );
}

/**
 * Grand bouton d'appel « numéro + libellé » (hero, zone d'intervention).
 */
export function PhoneCta({ caption, className = "" }: { caption: string; className?: string }) {
  return (
    <a
      href={telHref}
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-4 rounded-xl bg-brand-700 px-6 py-3.5 text-white shadow-lg shadow-brand-900/20 transition-colors hover:bg-brand-800 ${className}`}
    >
      <Icon name="phone" className="size-7 shrink-0 fill-current stroke-none" />
      <span className="leading-tight">
        <span className="block text-2xl font-semibold tabular-nums sm:text-[1.7rem]">{site.phone.display}</span>
        <span className="block text-base text-brand-100">{caption}</span>
      </span>
    </a>
  );
}

/** Bouton d'appel rond (en-tête mobile). */
export function PhoneIconLink({ className = "" }: { className?: string }) {
  return (
    <a
      href={telHref}
      aria-label={ariaLabel}
      className={`inline-flex size-11 items-center justify-center rounded-full bg-brand-700 text-white shadow-sm transition-colors hover:bg-brand-800 ${className}`}
    >
      <Icon name="phone" className="size-5 fill-current stroke-none" />
    </a>
  );
}
