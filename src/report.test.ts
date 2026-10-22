import { describe, expect, it } from "vitest";
import { parseReport } from "./report";
import { sampleReport } from "./sample";

describe("parseReport", () => {
  it("accepts slo-report output and drops unknown fields", () => {
    const raw = JSON.parse(JSON.stringify(sampleReport)) as { slos: Record<string, unknown>[] };
    raw.slos = raw.slos.map((s, i) => (i === 0 ? { ...s, extra: "ignored" } : s));
    const r = parseReport(raw);
    expect(r.slos).toHaveLength(4);
    expect(r.slos[0]).not.toHaveProperty("extra");
    expect(r.slos[1]?.timeToExhaustion).toBe("270.0d");
  });

  it("does not require numbers for SLOs without data", () => {
    const r = parseReport({
      slos: [{ name: "x", service: "s", objective: 99, window: "30d", noData: true, verdict: "NO DATA" }],
    });
    expect(r.slos[0]?.noData).toBe(true);
    expect(r.generatedAt).toBe("");
  });

  it.each([
    [null, /JSON object/],
    [{ slos: {} }, /must be an array/],
    [{ slos: [1] }, /slos\[0\] must be an object/],
    [{ slos: [{ name: "x", verdict: "OK" }] }, /unknown verdict/],
    [
      { slos: [{ name: "x", service: "s", objective: "high", window: "30d", verdict: "HEALTHY" }] },
      /"objective"/,
    ],
    [
      {
        slos: [
          { name: "x", service: "s", objective: 99, window: "30d", sli: Number.NaN, verdict: "HEALTHY" },
        ],
      },
      /"sli"/,
    ],
  ])("rejects %j", (input, error) => {
    expect(() => parseReport(input)).toThrow(error);
  });
});
