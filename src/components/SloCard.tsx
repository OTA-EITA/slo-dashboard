import { burnLevel, formatPercent } from "../burn";
import type { SloRow } from "../report";

const badge: Record<SloRow["verdict"], string> = {
  HEALTHY: "ok",
  "AT RISK": "warn",
  EXHAUSTED: "bad",
  "NO DATA": "none",
};

/** Budget remaining as a 0-100 bar; exhausted budgets render empty. */
function BudgetBar({ remaining }: { remaining: number }) {
  const clamped = Math.max(0, Math.min(100, remaining));
  const tone = remaining < 0 ? "bad" : remaining < 25 ? "warn" : "ok";
  return (
    <div
      className="bar"
      role="meter"
      aria-label="Error budget remaining"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
    >
      <div className={`bar-fill ${tone}`} style={{ width: `${String(clamped)}%` }} />
    </div>
  );
}

export function SloCard({ slo }: { slo: SloRow }) {
  return (
    <article className="card" aria-labelledby={`slo-${slo.name}`}>
      <header className="card-head">
        <div>
          <h2 id={`slo-${slo.name}`}>{slo.name}</h2>
          <p className="muted">
            {slo.service} · objective {formatPercent(slo.objective, slo.objective % 1 === 0 ? 0 : 1)} over{" "}
            {slo.window}
          </p>
        </div>
        <span className={`badge ${badge[slo.verdict]}`}>{slo.verdict}</span>
      </header>

      {slo.noData ? (
        <p className="muted">No traffic was recorded for this SLO in the window.</p>
      ) : (
        <>
          <dl className="stats">
            <div>
              <dt>SLI</dt>
              <dd>{formatPercent(slo.sli, 3)}</dd>
            </div>
            <div>
              <dt>Budget left</dt>
              <dd className={slo.budgetRemaining < 0 ? "bad-text" : ""}>
                {formatPercent(slo.budgetRemaining)}
              </dd>
            </div>
            <div>
              <dt>Exhausted in</dt>
              <dd>{slo.timeToExhaustion ?? "—"}</dd>
            </div>
          </dl>
          <BudgetBar remaining={slo.budgetRemaining} />
          <table className="burn">
            <caption>Burn rate (1.00x spends exactly the budget over {slo.window})</caption>
            <thead>
              <tr>
                {Object.keys(slo.burnRates).map((w) => (
                  <th key={w} scope="col">
                    {w}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {Object.entries(slo.burnRates).map(([w, rate]) => {
                  const level = burnLevel(rate, w, slo.window);
                  return (
                    <td
                      key={w}
                      className={`level-${level}`}
                      title={level === "ok" ? "below alert threshold" : `${level} alert`}
                    >
                      {rate.toFixed(2)}x{level !== "ok" && <span className="sr-only"> ({level} alert)</span>}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </>
      )}
    </article>
  );
}
