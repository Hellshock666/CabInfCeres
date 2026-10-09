import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { site } from "@/config/site";
import { RETENTION_DAYS } from "@/lib/callback-requests";

export const metadata: Metadata = {
  title: "Confidentialité et mentions légales",
  description: `Politique de confidentialité et mentions légales du ${site.fullName}.`,
  alternates: { canonical: "/confidentialite" },
};

/**
 * Les éléments entre crochets [À COMPLÉTER] doivent être renseignés par le cabinet
 * (et idéalement relus par un conseil juridique / DPO) avant la mise en ligne.
 */
export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <Link href="/" className="text-sm font-medium text-brand-700 hover:underline">
          ← Retour à l&apos;accueil
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-brand-950">Confidentialité et mentions légales</h1>

        <div className="mt-8 space-y-8 text-slate-700 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-brand-950 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6">
          <section>
            <h2>Responsable du traitement</h2>
            <p>
              {site.fullName} – {site.team.map((m) => m.name).join(" et ")}, infirmiers diplômés d&apos;État,{" "}
              {site.address.streetAddress}, {site.address.postalCode} {site.address.locality}. Téléphone :{" "}
              {site.phone.display}. [À COMPLÉTER : n° RPPS / SIRET]
            </p>
          </section>

          <section>
            <h2>Données collectées par le formulaire de rappel</h2>
            <p>Le formulaire collecte uniquement les informations strictement nécessaires pour vous rappeler :</p>
            <ul>
              <li>nom et prénom ;</li>
              <li>numéro de téléphone ;</li>
              <li>type de prise en charge (à domicile, au cabinet ou renseignement général) ;</li>
              <li>créneau de rappel souhaité (matin ou après-midi).</li>
            </ul>
            <p>
              Aucune information médicale n&apos;est demandée ni enregistrée. Merci de ne communiquer aucune donnée de
              santé par ce biais : elles seront échangées de vive voix avec l&apos;infirmier.
            </p>
          </section>

          <section>
            <h2>Finalité et base légale</h2>
            <p>
              Ces données sont utilisées exclusivement pour vous recontacter à votre demande (mesures
              précontractuelles prises à la demande de la personne concernée – article 6.1.b du RGPD).
            </p>
          </section>

          <section>
            <h2>Destinataires et hébergement</h2>
            <p>
              Seules les infirmiers du cabinet, authentifiées, ont accès à vos demandes. Les données sont hébergées
              par Google Cloud / Firebase dans l&apos;Union européenne [À COMPLÉTER : région exacte, ex.
              europe-west9 – Paris].
            </p>
          </section>

          <section>
            <h2>Durée de conservation</h2>
            <p>
              Les demandes sont <strong>supprimées automatiquement au plus tard {RETENTION_DAYS} jours</strong> après
              leur envoi, qu&apos;elles aient été traitées ou non. Elles peuvent aussi être supprimées manuellement dès
              leur traitement.
            </p>
          </section>

          <section>
            <h2>Vos droits</h2>
            <p>
              Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de limitation et
              d&apos;opposition. Pour l&apos;exercer, contactez le cabinet au {site.phone.display} [À COMPLÉTER :
              adresse e-mail ou postale]. Vous pouvez également introduire une réclamation auprès de la CNIL
              (www.cnil.fr).
            </p>
          </section>

          <section>
            <h2>Cookies</h2>
            <p>
              Ce site n&apos;utilise ni cookie publicitaire ni outil de mesure d&apos;audience. Seuls des éléments
              techniques nécessaires au fonctionnement (connexion de l&apos;espace infirmiers, protection anti-spam)
              peuvent être déposés.
            </p>
          </section>

          <section id="mentions-legales" className="scroll-mt-24">
            <h2>Mentions légales</h2>
            <p>
              Éditeur : {site.fullName}, {site.address.streetAddress}, {site.address.postalCode}{" "}
              {site.address.locality} – {site.phone.display}. Directeurs de la publication :{" "}
              {site.team.map((m) => m.name).join(" et ")}. Hébergeur : Google Cloud
              (Firebase App Hosting), Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irlande.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
