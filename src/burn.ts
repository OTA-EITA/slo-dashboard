/**
 * Multi-window, multi-burn-rate alerting from the Google SRE Workbook, the
 * same policy slo-report generates Prometheus rules from.
 */
export interface Policy {
  severity: "page" | "ticket";
  longHours: number;
  shortLabel: string;
  consumption: number;
}

export const policies: Policy[] = [
  { severity: "page", longHours: 1, shortLabel: "5m", consumption: 0.02 },
  { severity: "page", longHours: 6, shortLabel: "30m", consumption: 0.05 },
  { severity: "ticket", longHours: 24, shortLabel: "2h", consumption: 0.1 },
  { severity: "ticket", longHours: 72, shortLabel: "6h", consumption: 0.1 },
];

/** Parses "30d", "4w", "12h" or "90m" into hours. */
export function windowHours(window: string): number {
  const m = /^(\d+)([mhdw])$/.exec(window.trim());
  if (!m) throw new Error(`invalid window "${window}" (use e.g. 30d, 4w, 12h)`);
  const n = Number(m[1]);
  const unit = { m: 1 / 60, h: 1, d: 24, w: 168 }[m[2] as "m" | "h" | "d" | "w"];
  if (n <= 0) throw new Error("the window must be positive");
  return n * unit;
}

export interface Threshold extends Policy {
  /** Burn rate that triggers the alert. */
  factor: number;
  /** Error ratio that triggers the alert. */
  errorRatio: number;
  longLabel: string;
}

function label(hours: number): string {
  return hours % 24 === 0 ? `${String(hours / 24)}d` : `${String(hours)}h`;
}

const round = (x: number) => Math.round(x * 1e6) / 1e6;

/** Burn-rate factors for an SLO window; they do not depend on the objective. */
function factors(window: string): (Policy & { factor: number; longLabel: string })[] {
  const hours = windowHours(window);
  return policies
    .filter((p) => p.longHours < hours)
    .map((p) => ({
      ...p,
      factor: round((p.consumption * hours) / p.longHours),
      longLabel: label(p.longHours),
    }));
}

/** Alert thresholds for an SLO; policies whose long window is not shorter than the SLO window are dropped. */
export function thresholds(objective: number, window: string): Threshold[] {
  if (!(objective > 0 && objective < 100)) throw new Error("the objective must be between 0 and 100");
  const budget = 1 - objective / 100;
  return factors(window).map((p) => ({ ...p, errorRatio: round(p.factor * budget) }));
}

export type BurnLevel = "page" | "ticket" | "ok";

/**
 * Classifies a burn rate measured over windowLabel (e.g. "1h") against the
 * policy with that long window. Windows without a policy only flag burning
 * faster than the budget allows (rate >= 1).
 */
export function burnLevel(burn: number, windowLabel: string, sloWindow: string): BurnLevel {
  const p = factors(sloWindow).find((x) => x.longLabel === windowLabel);
  if (!p) return burn >= 1 ? "ticket" : "ok";
  return burn >= p.factor ? p.severity : "ok";
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}
