import type { IconName } from "@/components/ui/Icon";

/** Catalogue des soins affiché sur la page d'accueil (repris du mockup). */
export const services: { icon: IconName; title: string; items: string[] }[] = [
  {
    icon: "syringe",
    title: "Soins courants",
    items: ["Injections", "Prises de sang", "Gestion et surveillance des traitements", "Suivi des patients diabétiques"],
  },
  {
    icon: "ivBag",
    title: "Soins techniques",
    items: [
      "Perfusions",
      "Surveillance des traitements intraveineux",
      "Débranchement et retrait de chimiothérapie",
    ],
  },
  {
    icon: "bandage",
    title: "Plaies et pansements",
    items: ["Pansements simples et complexes", "Ulcères", "Plaies chroniques", "Pied diabétique"],
  },
  {
    icon: "users",
    title: "Accompagnement",
    items: [
      "Suivi clinique",
      "Coordination avec les médecins et établissements de santé",
      "Continuité des soins",
    ],
  },
];
