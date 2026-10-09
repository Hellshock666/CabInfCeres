import type { ReactNode } from "react";
import { formatInt } from "@/lib/stats";

/** Tuile de chiffre clé : libellé, valeur, contexte. */
export function StatTile({
  label,
  value,
  detail,
  hero = false,
  wide = false,
}: {
  label: string;
  value: string;
  detail?: ReactNode;
  hero?: boolean;
  /** Occupe toute la ligne sur mobile (grille à 2 colonnes). */
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 ${hero ? "flex h-full flex-col justify-center" : ""} ${wide ? "col-span-2 sm:col-span-1" : ""}`}
    >
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p
        className={
          hero
            ? "mt-1 text-5xl font-semibold tracking-tight text-brand-950 sm:text-6xl"
            : "mt-1 text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl"
        }
      >
        {value}
      </p>
      {detail ? <p className="mt-1 text-xs text-slate-500">{detail}</p> : null}
    </div>
  );
}

/** Carte de graphique avec titre, sous-titre et tableau de données dépliable (accessibilité). */
export function ChartCard({
  title,
  subtitle,
  table,
  children,
}: {
  title: string;
  subtitle?: string;
  table: { headers: string[]; rows: (string | number)[][] };
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <h2 className="font-semibold text-brand-950">{title}</h2>
      {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-xs font-medium text-brand-700 hover:underline">
          Voir le tableau des données
        </summary>
        <div className="mt-2 max-h-64 overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-white text-slate-500">
              <tr>
                {table.headers.map((h, i) => (
                  <th key={h} scope="col" className={`py-1.5 font-medium ${i > 0 ? "text-right" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="tabular-nums text-slate-700">
              {table.rows.map((row) => (
                <tr key={String(row[0])} className="border-t border-slate-100">
                  {row.map((cell, i) => (
                    <td key={i} className={`py-1.5 ${i > 0 ? "text-right" : ""}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

/** Barres horizontales (catégories peu nombreuses) : libellé, barre, valeur et part en bout de barre. */
export function HBarList({ items }: { items: { key: string; label: string; value: number }[] }) {
  const total = items.reduce((sum, i) => sum + i.value, 0);
  const max = Math.max(0, ...items.map((i) => i.value));
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const share = total > 0 ? Math.round((item.value / total) * 100) : 0;
        return (
          <li key={item.key} title={`${item.label} : ${formatInt(item.value)} (${share} %)`}>
            <p className="text-sm text-slate-700">{item.label}</p>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-4 min-w-0 flex-1">
                {item.value > 0 ? (
                  <div
                    className="h-full rounded-r bg-[#3f6fb3]"
                    style={{ width: `${max > 0 ? (item.value / max) * 100 : 0}%` }}
                  />
                ) : (
                  <div className="h-full w-px bg-slate-300" />
                )}
              </div>
              <span className="w-20 shrink-0 text-right text-sm tabular-nums text-slate-700">
                <span className="font-semibold">{formatInt(item.value)}</span>
                <span className="text-slate-500"> · {share} %</span>
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
