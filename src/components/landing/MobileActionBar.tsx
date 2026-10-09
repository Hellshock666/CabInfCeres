import { telHref } from "@/config/site";
import { Icon } from "@/components/ui/Icon";
import { ScrollToContactLink } from "@/components/ui/ScrollToContactLink";

/** Barre d'actions fixe en bas d'écran sur mobile : appel direct + demande de rappel. */
export function MobileActionBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
      <div className="grid grid-cols-2 gap-3">
        <a
          href={telHref}
          className="flex items-center justify-center gap-2 rounded-lg bg-brand-700 py-3 font-semibold text-white shadow-sm"
        >
          <Icon name="phone" className="size-4 fill-current stroke-none" />
          Appeler
        </a>
        <ScrollToContactLink className="flex items-center justify-center gap-2 rounded-lg border border-brand-200 bg-white py-3 font-semibold text-brand-800">
          <Icon name="calendar" className="size-4" />
          Être rappelé
        </ScrollToContactLink>
      </div>
    </div>
  );
}
