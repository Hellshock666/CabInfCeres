/** Navigation principale (en-tête, menu mobile, pied de page). */
export const mainNav = [
  { href: "/#accueil", label: "Accueil" },
  { href: "/#soins", label: "Nos soins" },
  { href: "/#domicile", label: "Soins à domicile" },
  { href: "/#equipe", label: "Le cabinet" },
  { href: "/#infos-pratiques", label: "Infos pratiques" },
  { href: "/#contact", label: "Contact" },
] as const;

export const footerNav = mainNav.filter((item) => item.label !== "Infos pratiques");
