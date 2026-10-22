import { useId, useState } from "react";
import { parseReport } from "../report";
import type { Report } from "../report";

/** Loads a report from a file or pasted JSON. Everything stays in the browser. */
export function ReportLoader({ onLoad }: { onLoad: (r: Report) => void }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const fileId = useId();
  const textId = useId();

  const load = (raw: string) => {
    try {
      onLoad(parseReport(JSON.parse(raw)));
      setError("");
    } catch (e) {
      setError(`Could not read the report: ${(e as Error).message}`);
    }
  };

  return (
    <section className="card" aria-labelledby="load-title">
      <h2 id="load-title">Load your report</h2>
      <p className="muted">
        Run <code>slo-report report --output json slos.yaml &gt; report.json</code> and open the file here. It
        is read in your browser and never uploaded.
      </p>
      <label htmlFor={fileId}>Report file</label>
      <input
        id={fileId}
        type="file"
        accept="application/json,.json"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void file.text().then(load);
        }}
      />
      <label htmlFor={textId}>…or paste JSON</label>
      <textarea
        id={textId}
        rows={4}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
        }}
      />
      <button
        type="button"
        onClick={() => {
          load(text);
        }}
      >
        Show report
      </button>
      <p role="alert" aria-live="polite" className="bad-text">
        {error}
      </p>
    </section>
  );
}
