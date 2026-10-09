import Link from "next/link";
import { site } from "@/config/site";
import { Icon } from "@/components/ui/Icon";
import { PhoneCta } from "@/components/ui/PhoneLink";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { CONTACT_HEADING_ID, CONTACT_SECTION_ID } from "@/components/ui/contact-anchor";
import { CallbackForm } from "./CallbackForm";

export function ContactSection() {
  return (
    <section
      id={CONTACT_SECTION_ID}
      aria-labelledby={CONTACT_HEADING_ID}
      className="scroll-mt-24 bg-white py-14 sm:py-20"
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
        <div>
          <SectionTitle id={CONTACT_HEADING_ID} focusable>
            Prendre rendez-vous
          </SectionTitle>
          <p className="mt-4 max-w-md text-slate-600">
            Le plus simple : appelez-nous, {site.hours.label}. Vous pouvez aussi laisser vos coordonnées, un infirmier
            du cabinet vous rappellera.
          </p>

          <PhoneCta caption="Appeler le cabinet" className="mt-6" />

          <div
            role="note"
            className="mt-6 flex max-w-md gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
          >
            <Icon name="alert" className="mt-0.5 size-5 shrink-0 text-amber-600" />
            <p>
              <strong>En cas d&apos;urgence</strong>, n&apos;utilisez pas ce formulaire : composez le{" "}
              <a href="tel:15" className="font-semibold underline">
                15
              </a>{" "}
              (SAMU) ou le{" "}
              <a href="tel:112" className="font-semibold underline">
                112
              </a>
              .
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-brand-50 p-5 sm:p-8">
          <h3 className="text-lg font-bold text-brand-900">Demander un rappel</h3>
          <p className="mt-1 text-sm text-slate-500">Tous les champs sont obligatoires.</p>
          <CallbackForm />
          <p className="mt-5 flex gap-2 text-xs leading-relaxed text-slate-500">
            <Icon name="shieldCheck" className="size-4 shrink-0 text-brand-500" />
            <span>
              Vos coordonnées servent uniquement à vous rappeler et sont automatiquement supprimées sous 14 jours.
              N&apos;indiquez aucune information médicale.{" "}
              <Link href="/confidentialite" className="underline hover:text-brand-700">
                Politique de confidentialité
              </Link>
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
