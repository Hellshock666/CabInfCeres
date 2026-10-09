import { site } from "@/config/site";

/** Pictogramme du cabinet : pousse à trois feuilles (bleu marine / bleu clair). */
export function LogoMark({ className = "size-10", light = false }: { className?: string; light?: boolean }) {
  const dark = light ? "#ffffff" : "#0c3d82";
  const mid = light ? "rgba(255,255,255,0.75)" : "#3f6fb3";
  const pale = light ? "rgba(255,255,255,0.55)" : "#9db9e1";
  return (
    <svg viewBox="0 0 48 56" aria-hidden="true" focusable="false" className={className}>
      {/* tige */}
      <path d="M24 54c0-10 .3-19 0-30" stroke={dark} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {/* feuille centrale */}
      <path d="M24 30C17 22 18 10 24 2c6 8 7 20 0 28z" fill={pale} />
      <path d="M24 30C21 22 21.5 11 24 2c6 8 7 20 0 28z" fill={mid} />
      {/* feuille gauche */}
      <path d="M23 40C13 41 4 33 2 20c11 1 20 8 21 20z" fill={dark} />
      {/* feuille droite */}
      <path d="M25 40c10 1 19-7 21-20-11 1-20 8-21 20z" fill={mid} />
    </svg>
  );
}

/** Logo complet : pictogramme + « Cérès / Cabinet infirmier / Reims Centre – Cathédrale ». */
export function Logo({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark light={light} className={compact ? "h-10 w-9 shrink-0" : "h-12 w-11 shrink-0"} />
      <span className="leading-none">
        <span
          className={`block font-serif font-bold ${compact ? "text-[2rem]" : "text-[2.4rem]"} leading-[0.85] ${
            light ? "text-white" : "text-brand-700"
          }`}
        >
          {site.brand}
        </span>
        <span className={`block text-[13px] ${light ? "text-brand-100" : "text-brand-800"}`}>Cabinet infirmier</span>
        <span className={`block text-[10px] ${light ? "text-brand-200" : "text-slate-500"}`}>{site.locationLabel}</span>
      </span>
    </span>
  );
}
