import type { Report } from "./report";

/**
 * Sample data. checkout, search and billing are the actual results of
 * slo-report's end-to-end test (six hours of synthetic traffic in
 * VictoriaMetrics); payments-latency is an illustrative "at risk" SLO.
 */
export const sampleReport: Report = {
  generatedAt: "2026-10-22T13:24:00Z",
  slos: [
    {
      name: "checkout-availability",
      service: "checkout",
      objective: 99.9,
      window: "30d",
      noData: false,
      sli: 98,
      budgetRemaining: -1900,
      burnRates: { "1h": 20, "6h": 20, "1d": 20 },
      verdict: "EXHAUSTED",
    },
    {
      name: "search-availability",
      service: "search",
      objective: 99.9,
      window: "30d",
      noData: false,
      sli: 99.99,
      budgetRemaining: 90,
      burnRates: { "1h": 0.1, "6h": 0.1, "1d": 0.1 },
      timeToExhaustion: "270.0d",
      verdict: "HEALTHY",
    },
    {
      name: "payments-latency",
      service: "payments",
      objective: 99,
      window: "30d",
      noData: false,
      sli: 99.21,
      budgetRemaining: 21,
      burnRates: { "1h": 4.2, "6h": 3.1, "1d": 3.4 },
      timeToExhaustion: "2.0d",
      verdict: "AT RISK",
    },
    {
      name: "billing-availability",
      service: "billing",
      objective: 99.9,
      window: "30d",
      noData: true,
      sli: 0,
      budgetRemaining: 0,
      burnRates: {},
      verdict: "NO DATA",
    },
  ],
};
