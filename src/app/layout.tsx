import type { Metadata, Viewport } from "next";
import { Caveat, Cormorant_Garamond, Inter } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { site } from "@/config/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

/** Serif élégante : marque « Cérès », sous-titres et citations. */
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-cormorant",
});

/** Manuscrite : accroches « Proches de vous, au quotidien. » / « Écoute, Soins, Confiance ». */
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500"],
  display: "swap",
  variable: "--font-caveat",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} – Infirmiers à Reims Centre, derrière la cathédrale`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.shortName,
  alternates: { canonical: "/" },
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }, { url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: site.shortName,
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/",
    siteName: site.fullName,
    title: `${site.name} – Soins infirmiers à Reims`,
    description: site.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0c3d82",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${inter.variable} ${cormorant.variable} ${caveat.variable}`} data-scroll-behavior="smooth">
      <body className="min-h-dvh font-sans">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
