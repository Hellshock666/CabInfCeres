import type { Metadata } from "next";
import { StatsApp } from "@/components/admin/stats/StatsApp";

export const metadata: Metadata = {
  title: "Statistiques",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Statistiques du site, réservées au propriétaire (custom claim `owner`).
 * Les données sont protégées côté serveur par firestore.rules ; la garde client ne sert qu'à l'affichage.
 */
export default function StatsPage() {
  return <StatsApp />;
}
