import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Espace infirmiers",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-dvh bg-slate-50">{children}</div>;
}
