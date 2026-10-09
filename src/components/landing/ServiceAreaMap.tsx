import { site } from "@/config/site";
import { Icon } from "@/components/ui/Icon";

/** Position des libellés (en % du cadre) – disposition reprise du mockup, schéma non à l'échelle. */
const labels: { name: string; x: number; y: number }[] = [
  { name: "Sainte-Anne", x: 32, y: 9 },
  { name: "Pommery", x: 66, y: 9 },
  { name: "Clemenceau", x: 14, y: 27 },
  { name: "Jean-Jaurès", x: 84, y: 23 },
  { name: "Boulingrin", x: 15, y: 74 },
  { name: "Centre", x: 44, y: 82 },
  { name: "Petit Bétheny", x: 79, y: 80 },
];

/**
 * Plan schématique de la zone d'intervention (SVG + libellés HTML).
 * Volontairement sans carte embarquée : aucun cookie tiers, aucun script externe.
 */
export function ServiceAreaMap() {
  return (
    <figure className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#eef0f2] ring-1 ring-slate-200 lg:aspect-auto lg:h-full lg:min-h-64">
      <svg
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        className="absolute inset-0 size-full"
      >
        <g fill="none" stroke="#fff" strokeLinecap="round">
          {/* boulevards circulaires */}
          <ellipse cx="200" cy="150" rx="70" ry="55" strokeWidth="5" />
          <ellipse cx="200" cy="150" rx="140" ry="105" strokeWidth="4" />
          <ellipse cx="200" cy="150" rx="215" ry="160" strokeWidth="3" />
          {/* axes radiaux */}
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i * Math.PI) / 6 + 0.2;
            return (
              <line
                key={i}
                x1={200 + Math.cos(a) * 20}
                y1={150 + Math.sin(a) * 15}
                x2={200 + Math.cos(a) * 320}
                y2={150 + Math.sin(a) * 240}
                strokeWidth={i % 3 === 0 ? 5 : 3}
              />
            );
          })}
          {/* rues secondaires */}
          <path d="M40 60 Q120 90 170 40 M250 270 Q300 200 390 230 M10 200 Q90 180 120 280 M300 20 Q280 90 380 110" strokeWidth="2" />
        </g>
      </svg>

      {labels.map((label) => (
        <span
          key={label.name}
          className="absolute -translate-x-1/2 -translate-y-1/2 text-xs whitespace-nowrap text-brand-700 sm:text-[13px]"
          style={{ left: `${label.x}%`, top: `${label.y}%` }}
        >
          {label.name}
        </span>
      ))}

      <span className="absolute top-[27%] left-[46%] -translate-x-1/2 -translate-y-1/2 text-xl font-bold text-brand-900">
        Reims
      </span>

      {/* Cabinet */}
      <span className="absolute top-[45%] left-[42%] flex -translate-y-1/2 items-center gap-1">
        <Icon name="mapPin" className="size-8 shrink-0 fill-brand-800 stroke-[#eef0f2]" />
        <span className="rounded-md bg-white px-2 py-1 text-[11px] leading-tight shadow-sm sm:text-xs">
          <span className="block font-semibold text-brand-900">Cabinet Cérès</span>
          <span className="block text-slate-600">{site.address.streetAddress}</span>
        </span>
      </span>

      {/* Cathédrale */}
      <span className="absolute top-[60%] left-[38%] flex items-center gap-1.5 text-xs leading-tight font-semibold text-brand-900 sm:text-[13px]">
        <CathedralGlyph className="h-7 w-6 shrink-0 text-brand-800" />
        <span>
          Cathédrale
          <br />
          de Reims
        </span>
      </span>

      <figcaption className="absolute right-2 bottom-1.5 text-[10px] text-slate-400">Plan schématique</figcaption>
    </figure>
  );
}

function CathedralGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 28" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M2 28V9l2.5-5L7 9v3h10V9l2.5-5L22 9v19h-7v-5a3 3 0 0 0-6 0v5z" />
      <circle cx="12" cy="16" r="2" fill="#eef0f2" />
      <path d="M3.8 12h1.4v4H3.8zM18.8 12h1.4v4h-1.4z" fill="#eef0f2" />
    </svg>
  );
}
