import Link from "next/link";
import { footerNav } from "@/config/navigation";
import { site, telHref } from "@/config/site";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/LogoMark";

export function SiteFooter() {
  return (
    <footer className="bg-brand-700 pb-24 text-brand-100 md:pb-0">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" aria-label={`${site.fullName} – accueil`} className="w-fit">
          <Logo light />
        </Link>

        <nav aria-label="Liens du pied de page">
          <ul className="flex flex-wrap gap-x-7 gap-y-2 text-sm font-medium text-white">
            {footerNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <a
          href={telHref}
          aria-label={`Appeler le cabinet au ${site.phone.display}`}
          className="flex w-fit items-center gap-3 text-2xl font-semibold text-white tabular-nums hover:underline lg:border-l lg:border-white/25 lg:pl-10"
        >
          <Icon name="phone" className="size-6 fill-current stroke-none" />
          {site.phone.display}
        </a>
      </div>

      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-brand-100 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © {new Date().getFullYear()} {site.name} - {site.address.locality}
          </p>
          <p className="flex flex-wrap items-center gap-x-3">
            <Link href="/confidentialite#mentions-legales" className="hover:underline">
              Mentions légales
            </Link>
            <span aria-hidden="true">|</span>
            <Link href="/confidentialite" className="hover:underline">
              Politique de confidentialité
            </Link>
            <span aria-hidden="true">|</span>
            <Link href="/admin" prefetch={false} rel="nofollow" className="hover:underline">
              Espace infirmiers
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
