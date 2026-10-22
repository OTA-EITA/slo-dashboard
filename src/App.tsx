import { useState } from "react";
import { ReportLoader } from "./components/ReportLoader";
import { SloCard } from "./components/SloCard";
import { ThresholdCalculator } from "./components/ThresholdCalculator";
import type { Report, Verdict } from "./report";
import { sampleReport } from "./sample";

const order: Verdict[] = ["EXHAUSTED", "AT RISK", "HEALTHY", "NO DATA"];

export function App() {
  const [report, setReport] = useState<Report>(sampleReport);
  const [isSample, setIsSample] = useState(true);
  const slos = [...report.slos].sort((a, b) => order.indexOf(a.verdict) - order.indexOf(b.verdict));
  const count = (v: Verdict) => report.slos.filter((s) => s.verdict === v).length;

  return (
    <main>
      <header className="page-head">
        <h1>SLO Dashboard</h1>
        <p className="muted">
          Error budgets and burn rates from <a href="https://github.com/OTA-EITA/slo-report">slo-report</a>
          {report.generatedAt &&
            ` · generated ${new Date(report.generatedAt).toISOString().slice(0, 16).replace("T", " ")} UTC`}
          {isSample && " · showing sample data"}
        </p>
        <ul className="summary" aria-label="SLOs by verdict">
          {order.map((v) => (
            <li key={v}>
              <strong>{count(v)}</strong> {v.toLowerCase()}
            </li>
          ))}
        </ul>
      </header>

      <div className="grid">
        {slos.map((s) => (
          <SloCard key={s.name} slo={s} />
        ))}
      </div>

      <div className="grid two">
        <ReportLoader
          onLoad={(r) => {
            setReport(r);
            setIsSample(false);
          }}
        />
        <ThresholdCalculator />
      </div>
    </main>
  );
}
