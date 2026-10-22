/** One SLO as produced by `slo-report report --output json`. */
export interface SloRow {
  name: string;
  service: string;
  objective: number;
  window: string;
  noData: boolean;
  sli: number;
  budgetRemaining: number;
  burnRates: Record<string, number>;
  timeToExhaustion?: string;
  verdict: Verdict;
}

export type Verdict = "HEALTHY" | "AT RISK" | "EXHAUSTED" | "NO DATA";

export interface Report {
  generatedAt: string;
  slos: SloRow[];
}

const verdicts: Verdict[] = ["HEALTHY", "AT RISK", "EXHAUSTED", "NO DATA"];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function field<T>(
  obj: Record<string, unknown>,
  key: string,
  check: (v: unknown) => v is T,
  where: string,
): T {
  const v = obj[key];
  if (!check(v)) throw new Error(`${where}: "${key}" is missing or has the wrong type`);
  return v;
}

const isString = (v: unknown): v is string => typeof v === "string";
const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/**
 * Validates untrusted JSON (an uploaded or pasted report) and returns a typed
 * report. Unknown fields are ignored; missing or mistyped fields are errors.
 */
export function parseReport(input: unknown): Report {
  if (!isRecord(input)) throw new Error("the report must be a JSON object");
  const slos = input.slos;
  if (!Array.isArray(slos)) throw new Error('"slos" must be an array');
  return {
    generatedAt: isString(input.generatedAt) ? input.generatedAt : "",
    slos: slos.map((raw, i): SloRow => {
      const where = `slos[${String(i)}]`;
      if (!isRecord(raw)) throw new Error(`${where} must be an object`);
      const verdict = field(raw, "verdict", isString, where);
      if (!(verdicts as string[]).includes(verdict))
        throw new Error(`${where}: unknown verdict "${verdict}"`);
      const noData = raw.noData === true;
      const burnRates: Record<string, number> = {};
      if (isRecord(raw.burnRates)) {
        for (const [k, v] of Object.entries(raw.burnRates)) if (isNumber(v)) burnRates[k] = v;
      }
      const row: SloRow = {
        name: field(raw, "name", isString, where),
        service: field(raw, "service", isString, where),
        objective: field(raw, "objective", isNumber, where),
        window: field(raw, "window", isString, where),
        noData,
        sli: noData ? 0 : field(raw, "sli", isNumber, where),
        budgetRemaining: noData ? 0 : field(raw, "budgetRemaining", isNumber, where),
        burnRates,
        verdict: verdict as Verdict,
      };
      if (isString(raw.timeToExhaustion) && raw.timeToExhaustion !== "")
        row.timeToExhaustion = raw.timeToExhaustion;
      return row;
    }),
  };
}
