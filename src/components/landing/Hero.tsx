import Image from "next/image";
import { site } from "@/config/site";
import { Icon, type IconName } from "@/components/ui/Icon";
import { PhoneCta } from "@/components/ui/PhoneLink";
import { ScrollToContactLink } from "@/components/ui/ScrollToContactLink";
import heroImage from "@/assets/hero-cathedrale.webp";

const highlights: { icon: IconName; title: string; detail: string }[] = [
  { icon: "calendar", title: site.hours.short, detail: site.hours.detail },
  { icon: "home", title: "À domicile", detail: "à Reims et environs" },
  { icon: "handshake", title: "Sur rendez-vous", detail: "au cabinet" },
];

export function Hero() {
  return (
    <section id="accueil" className="relative scroll-mt-24 overflow-hidden bg-white">
      {/* Photo de la cathédrale, fondue vers la gauche */}
      <div className="absolute top-0 right-0 h-[25rem] w-[58%] sm:h-[28rem] lg:h-full lg:w-[60%]">
        <Image
          src={heroImage}
          alt="La cathédrale Notre-Dame de Reims, à deux pas du cabinet"
          fill
          priority
          placeholder="blur"
          sizes="(min-width: 1024px) 60vw, 58vw"
          className="object-cover object-[22%_center]"
        />
        <div className="absolute inset-0 bg-linear-to-r from-white via-white/60 via-25% to-transparent to-70% lg:via-white/25 lg:via-15% lg:to-45%" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent lg:hidden" />
        <p
          aria-hidden="true"
          className="absolute top-6 right-4 hidden -rotate-12 text-right font-script text-3xl leading-tight text-brand-800 sm:block lg:top-10 lg:right-10 lg:text-[2.6rem]"
        >
          {site.taglines.hero[0]}
          <br />
          <span className="pr-1">{site.taglines.hero[1]}</span>
        </p>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pt-8 pb-12 sm:px-6 sm:pt-12 lg:pt-14 lg:pb-16">
        <h1 className="max-w-[60%] text-brand-900 sm:max-w-none">
          <span className="block text-xs font-semibold tracking-[0.25em] uppercase sm:text-sm">Cabinet infirmier</span>
          <span className="mt-1 block font-serif text-6xl leading-[0.9] font-bold text-brand-700 sm:text-7xl lg:text-8xl">
            {site.brand}
          </span>
          <span className="mt-1 block font-serif text-2xl font-medium text-brand-800 sm:text-3xl lg:text-[2.1rem]">
            {site.locationLabel}
          </span>
        </h1>

        <p className="mt-3 max-w-[62%] text-lg leading-snug font-bold text-brand-800 sm:max-w-xl sm:text-xl lg:text-2xl">
          Soins infirmiers à domicile et au cabinet
        </p>
        <p className="mt-3 max-w-[62%] text-sm text-slate-700 sm:max-w-xl sm:text-base lg:text-lg">
          {site.team.map((m) => m.name).join(" & ")}
          <br />
          Infirmiers diplômés d&apos;État – {site.experience.short}
        </p>

        <ul className="mt-8 grid gap-4 sm:mt-10 sm:flex sm:flex-wrap sm:gap-8">
          {highlights.map((item) => (
            <li key={item.title} className="flex items-center gap-3">
              <Icon name={item.icon} className="size-8 shrink-0 text-brand-700" />
              <span className="leading-tight">
                <span className="block font-semibold text-brand-900">{item.title}</span>
                <span className="block text-sm text-slate-600">{item.detail}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-stretch">
          <PhoneCta caption="Appeler le cabinet" className="justify-center sm:justify-start" />
          <a
            href={site.address.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/95 px-5 py-3 shadow-sm backdrop-blur transition-colors hover:border-brand-200"
          >
            <Icon name="mapPin" className="size-7 shrink-0 fill-brand-700 stroke-white" />
            <span className="text-sm leading-snug">
              <span className="block font-semibold text-brand-900">{site.address.streetAddress}</span>
              <span className="block font-semibold text-brand-900">
                {site.address.postalCode} {site.address.locality}
              </span>
              <span className="block text-slate-600 italic">{site.address.landmark}</span>
            </span>
          </a>
        </div>

        <ScrollToContactLink className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 underline-offset-4 hover:underline">
          <Icon name="calendar" className="size-4" />
          Prendre rendez-vous / Demander un rappel
          <Icon name="arrowRight" className="size-4" />
        </ScrollToContactLink>
      </div>
    </section>
  );
}
