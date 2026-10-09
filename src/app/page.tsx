import { ContactSection } from "@/components/landing/ContactSection";
import { Hero } from "@/components/landing/Hero";
import { MobileActionBar } from "@/components/landing/MobileActionBar";
import { ExpertiseBand } from "@/components/landing/ExpertiseBand";
import { LocalSection } from "@/components/landing/LocalSection";
import { Services } from "@/components/landing/Services";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { site } from "@/config/site";

/** Données structurées Schema.org pour le référencement local. */
function buildJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: site.fullName,
    description: site.description,
    url: site.url,
    telephone: site.phone.e164,
    image: `${site.url}/icons/icon-512.png`,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.streetAddress,
      postalCode: site.address.postalCode,
      addressLocality: site.address.locality,
      addressCountry: site.address.country,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: site.hours.opens,
        closes: site.hours.closes,
      },
    ],
    areaServed: site.serviceAreas.map((area) => ({ "@type": "Place", name: `${area}, Reims` })),
    employee: site.team.map((m) => ({ "@type": "Person", name: m.name, jobTitle: m.title })),
    hasMap: site.address.mapsUrl,
    availableService: ["Soins infirmiers à domicile", "Soins infirmiers au cabinet", "Prises de sang", "Perfusions", "Pansements"].map(
      (name) => ({ "@type": "MedicalProcedure", name }),
    ),
  };
}

export default function HomePage() {
  return (
    <>
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow"
      >
        Aller au contenu
      </a>
      <SiteHeader />
      <main id="contenu">
        <Hero />
        <Services />
        <LocalSection />
        <ExpertiseBand />
        <ContactSection />
      </main>
      <SiteFooter />
      <MobileActionBar />
      <script
        type="application/ld+json"
        // Contenu statique issu de la configuration : aucune donnée utilisateur.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd()).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
