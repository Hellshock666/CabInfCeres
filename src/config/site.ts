/**
 * Source unique des informations du cabinet (reprises du mockup de référence).
 * Toute évolution (horaires, quartiers, équipe…) se fait ici.
 */
const streetAddress = "3 rue Saint-Symphorien";
const postalCode = "51100";
const locality = "Reims";

export const site = {
  name: "Cabinet infirmier Cérès",
  brand: "Cérès",
  locationLabel: "Reims Centre – Cathédrale",
  fullName: "Cabinet infirmier Cérès – Reims Centre Cathédrale",
  shortName: "Cabinet Cérès",
  description:
    "Cabinet infirmier Cérès, derrière la cathédrale de Reims : soins infirmiers à domicile et au cabinet, 7j/7 de 6h à 20h. Jean-Daniel Fleury et Vincent Barrière, infirmiers diplômés d'État, plus de 25 ans d'expérience.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),

  taglines: {
    header: ["Écoute", "Soins", "Confiance"],
    hero: ["Proches de vous,", "au quotidien."],
    quality: "Une prise en charge de qualité, dans le respect de chaque patient.",
  },

  phone: {
    display: "03 26 06 95 42",
    e164: "+33326069542",
  },

  hours: {
    label: "7j/7 de 6h à 20h",
    short: "7j/7",
    detail: "de 6h à 20h",
    opens: "06:00",
    closes: "20:00",
  },

  address: {
    streetAddress,
    postalCode,
    locality,
    country: "FR",
    landmark: "Derrière la cathédrale",
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `Cabinet infirmier Cérès, ${streetAddress}, ${postalCode} ${locality}`,
    )}`,
  },

  team: [
    { name: "Jean-Daniel Fleury", title: "Infirmier diplômé d'État" },
    { name: "Vincent Barrière", title: "Infirmier diplômé d'État" },
  ],

  experience: {
    title: "Plus de 25 ans d'expérience infirmière",
    short: "Plus de 25 ans d'expérience",
    text: "Notre expérience nous permet d'assurer aussi bien des soins ponctuels que des prises en charge régulières et techniques, avec une approche professionnelle, bienveillante et rigoureuse.",
  },

  /** Quartiers desservis pour les soins à domicile. */
  serviceAreas: [
    "Centre",
    "Cathédrale",
    "Sainte-Anne",
    "Clemenceau",
    "Pommery",
    "Jean-Jaurès",
    "Boulingrin",
    "Petit Bétheny",
  ],

  appointmentsOnly: "Soins exclusivement sur rendez-vous",
} as const;

export const telHref = `tel:${site.phone.e164}`;
