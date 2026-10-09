import { site } from "@/config/site";
import { LogoMark } from "@/components/ui/LogoMark";

/** Bandeau « Le cabinet » : engagement qualité, expérience et équipe. */
export function ExpertiseBand() {
  return (
    <section
      id="equipe"
      aria-labelledby="equipe-titre"
      className="relative scroll-mt-24 overflow-hidden bg-gradient-to-r from-brand-50 via-[#f5f8fc] to-brand-50"
    >
      <BlurredLeaves className="pointer-events-none absolute top-1/2 -left-10 hidden h-56 -translate-y-1/2 text-emerald-700/50 blur-[6px] md:block" />

      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1fr_auto_1.3fr] md:items-center lg:grid-cols-[1fr_auto_1.3fr_auto_auto] lg:gap-10 lg:py-14">
        <blockquote className="md:pl-20 lg:pl-28">
          <p className="font-serif text-2xl leading-snug text-brand-800 italic sm:text-[1.7rem]">{site.taglines.quality}</p>
          <span aria-hidden="true" className="mt-4 block h-0.5 w-10 rounded-full bg-brand-700" />
        </blockquote>

        <span aria-hidden="true" className="hidden h-24 w-px bg-brand-200 md:block" />

        <div>
          <h2 id="equipe-titre" className="text-xl font-bold text-brand-900 sm:text-2xl">
            {site.experience.title}
          </h2>
          <p className="mt-2 text-slate-600">{site.experience.text}</p>
        </div>

        <LogoMark className="hidden h-28 w-24 opacity-80 lg:block" />

        <ul className="space-y-4 border-t border-brand-100 pt-6 md:col-span-3 md:flex md:gap-10 md:space-y-0 lg:col-span-1 lg:block lg:space-y-0 lg:border-0 lg:pt-0">
          {site.team.map((member, index) => (
            <li key={member.name}>
              {index > 0 ? (
                <span aria-hidden="true" className="my-3 hidden h-px w-8 bg-brand-300 lg:block" />
              ) : null}
              <p className="font-semibold text-brand-900">{member.name}</p>
              <p className="text-sm text-slate-600">{member.title}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Feuillage flou décoratif (rappel du visuel du mockup), sans image externe. */
function BlurredLeaves({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 200" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M20 20c40 0 70 25 75 60-35 0-70-20-75-60z" />
      <path d="M10 90c35-5 70 15 80 50-35 5-70-15-80-50z" />
      <path d="M30 150c30-10 60 0 75 30-30 10-60 0-75-30z" />
      <path d="M60 40c25 10 40 35 35 60-25-10-40-35-35-60z" opacity=".7" />
    </svg>
  );
}
