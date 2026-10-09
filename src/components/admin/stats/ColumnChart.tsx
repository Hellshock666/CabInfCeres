"use client";

import { useEffect, useId, useRef, useState } from "react";

export interface Column {
  key: string;
  /** Libellé court de l'axe horizontal. */
  label: string;
  value: number;
  /** Lignes de l'infobulle (la première est le titre). */
  tooltip: string[];
}

const HEIGHT = 180;
const PAD = { top: 18, right: 4, bottom: 22, left: 34 };
const MAX_BAR = 24;
const GAP = 2;

/** Arrondi « propre » du maximum de l'axe et pas des graduations. */
function niceScale(max: number): { top: number; step: number } {
  if (max <= 0) return { top: 4, step: 1 };
  const rough = max / 4;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= rough && (s >= 1 || pow < 1))!;
  const stepInt = Math.max(1, step);
  return { top: Math.ceil(max / stepInt) * stepInt, step: stepInt };
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Barre à extrémité arrondie (4 px) et base carrée, posée sur la ligne de base. */
function barPath(x: number, y: number, w: number, h: number): string {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

/**
 * Histogramme vertical à une série (SVG, sans dépendance).
 * Survol / toucher / clavier : infobulle par colonne. Le maximum est étiqueté directement.
 */
export function ColumnChart({
  columns,
  ariaLabel,
  formatValue = (v) => String(v),
  minLabelSpacing = 40,
}: {
  columns: Column[];
  ariaLabel: string;
  formatValue?: (v: number) => string;
  /** Espace minimal (px) entre deux libellés de l'axe horizontal. */
  minLabelSpacing?: number;
}) {
  const [wrapRef, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const tooltipId = useId();

  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const max = Math.max(0, ...columns.map((c) => c.value));
  const { top, step } = niceScale(max);
  const slot = columns.length > 0 ? plotW / columns.length : 0;
  const barW = Math.max(1, Math.min(MAX_BAR, slot - GAP, slot * 0.72));
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH;
  const labelEvery = Math.max(1, Math.ceil(minLabelSpacing / Math.max(slot, 1)));
  const maxIndex = max > 0 ? columns.findIndex((c) => c.value === max) : -1;
  const ticks = Array.from({ length: Math.floor(top / step) + 1 }, (_, i) => i * step);

  const activeCol = active !== null ? columns[active] : null;
  const tipLeft = active !== null ? PAD.left + slot * (active + 0.5) : 0;

  return (
    <div ref={wrapRef} className="relative w-full" onPointerLeave={() => setActive(null)}>
      {width > 0 ? (
        <svg width={width} height={HEIGHT} role="img" aria-label={ariaLabel} className="block overflow-visible">
          {/* Grille horizontale discrète + graduations */}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="#e2e8f0" strokeWidth={1} />
              <text x={PAD.left - 6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-slate-500 text-[11px] tabular-nums">
                {formatValue(t)}
              </text>
            </g>
          ))}

          {columns.map((c, i) => {
            const x = PAD.left + slot * i + (slot - barW) / 2;
            const h = Math.max(0, PAD.top + plotH - y(c.value));
            const isActive = active === i;
            return (
              <g key={c.key}>
                {h > 0 ? (
                  <path
                    d={barPath(x, y(c.value), barW, h)}
                    fill={isActive ? "#0c3d82" : "#3f6fb3"}
                    className="transition-colors"
                  />
                ) : null}
                {/* Valeur sur le sommet de la plus haute colonne uniquement */}
                {i === maxIndex ? (
                  <text
                    x={x + barW / 2}
                    y={y(c.value) - 5}
                    textAnchor="middle"
                    className="fill-slate-700 text-[11px] font-semibold"
                  >
                    {formatValue(c.value)}
                  </text>
                ) : null}
                {i % labelEvery === 0 ? (
                  <text
                    x={PAD.left + slot * (i + 0.5)}
                    y={HEIGHT - 6}
                    textAnchor="middle"
                    className="fill-slate-500 text-[11px]"
                  >
                    {c.label}
                  </text>
                ) : null}
                {/* Zone de survol plus large que la barre (toute la hauteur du créneau) */}
                <rect
                  x={PAD.left + slot * i}
                  y={PAD.top}
                  width={slot}
                  height={plotH}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={c.tooltip.join(", ")}
                  aria-describedby={isActive ? tooltipId : undefined}
                  onPointerEnter={() => setActive(i)}
                  onPointerDown={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  className="cursor-default outline-none focus-visible:stroke-brand-400 focus-visible:stroke-2"
                />
              </g>
            );
          })}

          <line
            x1={PAD.left}
            x2={width - PAD.right}
            y1={PAD.top + plotH}
            y2={PAD.top + plotH}
            stroke="#94a3b8"
            strokeWidth={1}
          />
        </svg>
      ) : (
        <div style={{ height: HEIGHT }} />
      )}

      {activeCol ? (
        <div
          id={tooltipId}
          role="tooltip"
          className="pointer-events-none absolute z-10 w-max max-w-[220px] -translate-x-1/2 -translate-y-full rounded-lg bg-brand-950 px-3 py-2 text-xs text-white shadow-lg"
          style={{
            left: Math.min(Math.max(tipLeft, 80), Math.max(80, width - 80)),
            top: y(activeCol.value) - 8,
          }}
        >
          <p className="font-semibold">{activeCol.tooltip[0]}</p>
          {activeCol.tooltip.slice(1).map((line) => (
            <p key={line} className="text-brand-100">
              {line}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
