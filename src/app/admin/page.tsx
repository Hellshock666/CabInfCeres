import { AdminApp } from "@/components/admin/AdminApp";

/**
 * Espace infirmiers. L'accès aux données est protégé côté serveur par firestore.rules
 * (custom claim `nurse`) ; la garde côté client ne sert qu'à l'affichage.
 */
export default function AdminPage() {
  return <AdminApp />;
}
