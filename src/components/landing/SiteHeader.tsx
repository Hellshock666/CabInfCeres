import Link from "next/link";
import { mainNav } from "@/config/navigation";
import { site } from "@/config/site";
import { Logo } from "@/components/ui/LogoMark";
import { PhoneIconLink, PhoneLink } from "@/components/ui/PhoneLink";
import { MobileMenu } from "./MobileMenu";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="relative mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-20">
        <Link href="/" aria-label={`${site.fullName} – accueil`} className="shrink-0">
          <Logo compact />
        </Link>

        <nav aria-label="Navigation principale" className="hidden lg:block">
          <ul className="flex items-center gap-7 text-[13px] font-medium text-brand-900">
            {mainNav.map((item, index) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`border-b-2 pb-1 transition-colors hover:border-brand-300 hover:text-brand-700 ${
                    index === 0 ? "border-brand-700" : "border-transparent"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2 sm:gap-5">
          <span className="hidden sm:block">
            <PhoneLink />
          </span>
          <span className="sm:hidden">
            <PhoneIconLink />
          </span>
          <p
            aria-hidden="true"
            className="hidden -rotate-6 font-script text-xl leading-[0.95] text-brand-800 xl:block"
          >
            {site.taglines.header.map((word, i) => (
              <span key={word} className="block" style={{ paddingLeft: `${i * 0.6}rem` }}>
                {word}
              </span>
            ))}
          </p>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
