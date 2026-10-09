import type { NextConfig } from "next";

/** En-têtes de sécurité appliqués à toutes les pages. */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

/**
 * Configuration Web Firebase : sur App Hosting, elle est injectée automatiquement au build
 * (variable FIREBASE_WEBAPP_CONFIG, backend lié à l'application Web créée par Terraform).
 * En local, les variables NEXT_PUBLIC_FIREBASE_* de .env.local sont prioritaires.
 */
const webAppConfig: Record<string, string> = (() => {
  try {
    return JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG ?? "{}");
  } catch {
    return {};
  }
})();

const firebaseEnv = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || webAppConfig.apiKey,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || webAppConfig.authDomain,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || webAppConfig.projectId,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || webAppConfig.storageBucket,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || webAppConfig.messagingSenderId,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || webAppConfig.appId,
};

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: Object.fromEntries(Object.entries(firebaseEnv).filter(([, value]) => Boolean(value))) as Record<string, string>,
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        // Le service worker ne doit jamais être mis en cache par le navigateur ou le CDN.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
