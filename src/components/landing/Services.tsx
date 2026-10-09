import { services } from "@/config/services";
import { Icon } from "@/components/ui/Icon";
import { SectionTitle } from "@/components/ui/SectionTitle";

export function Services() {
  return (
    <section id="soins" aria-labelledby="soins-titre" className="scroll-mt-24 bg-white pt-6 pb-12 sm:pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle id="soins-titre">Nos soins infirmiers</SectionTitle>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <li key={service.title} className="flex gap-4 rounded-xl bg-brand-50 p-5 lg:p-6">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white text-brand-700 shadow-sm ring-1 ring-brand-100">
                <Icon name={service.icon} className="size-7" strokeWidth={1.6} />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-brand-900 lg:text-[1.05rem]">{service.title}</h3>
                <ul className="mt-2.5 space-y-1 text-sm leading-snug text-slate-600">
                  {service.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
