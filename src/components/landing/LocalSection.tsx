import { site } from "@/config/site";
import { Icon, type IconName } from "@/components/ui/Icon";
import { PhoneCta } from "@/components/ui/PhoneLink";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ServiceAreaMap } from "./ServiceAreaMap";

/** Rangée « À domicile à Reims et environs » + plan + carte « Le cabinet ». */
export function LocalSection() {
  return (
    <section aria-label="Zone d'intervention et informations pratiques" className="bg-white pb-14 sm:pb-20">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr_0.85fr] lg:gap-6">
        <HomeCare />
        <ServiceAreaMap />
        <PracticeInfo />
      </div>
    </section>
  );
}

function HomeCare() {
  return (
    <div id="domicile" className="scroll-mt-24">
      <SectionTitle>À domicile à Reims et environs</SectionTitle>
      <p className="mt-4 text-slate-600">
        Nous intervenons 7 jours sur 7 auprès de nos patients à Reims et dans les quartiers suivants :
      </p>
      <p className="mt-3 font-semibold text-brand-900">
        {site.serviceAreas.join(" • ")}
        <br />
        et secteurs limitrophes.
      </p>
      <PhoneCta caption="Nous contacter" className="mt-6" />
    </div>
  );
}

const practiceItems: { icon: IconName; lines: React.ReactNode }[] = [
  {
    icon: "mapPin",
    lines: (
      <>
        <span className="block font-semibold text-brand-900">{site.address.streetAddress}</span>
        <span className="block font-semibold text-brand-900">
          {site.address.postalCode} {site.address.locality}
        </span>
        <span className="block text-sm text-slate-600 italic">{site.address.landmark}</span>
      </>
    ),
  },
  {
    icon: "calendar",
    lines: <span className="block font-semibold text-brand-900">{site.appointmentsOnly}</span>,
  },
  {
    icon: "clock",
    lines: <span className="block font-semibold text-brand-900">{site.hours.label}</span>,
  },
];

function PracticeInfo() {
  return (
    <div id="infos-pratiques" className="scroll-mt-24 rounded-xl bg-brand-50 p-6">
      <SectionTitle as="h2">Le cabinet</SectionTitle>
      <ul className="mt-5 space-y-4">
        {practiceItems.map((item) => (
          <li key={item.icon} className="flex gap-3.5">
            <Icon name={item.icon} className="mt-0.5 size-7 shrink-0 text-brand-800" />
            <span className="leading-snug">{item.lines}</span>
          </li>
        ))}
      </ul>
      <a
        href={site.address.mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-brand-100 px-5 py-3 font-semibold text-brand-900 transition-colors hover:bg-brand-200"
      >
        Itinéraire
        <Icon name="arrowRight" className="size-4" />
        <span className="sr-only">(ouvre Google Maps dans un nouvel onglet)</span>
      </a>
    </div>
  );
}
