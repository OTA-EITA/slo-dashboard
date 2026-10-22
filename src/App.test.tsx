import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("shows the sample report, worst SLOs first", () => {
    render(<App />);
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings.slice(0, 4)).toEqual([
      "checkout-availability",
      "payments-latency",
      "search-availability",
      "billing-availability",
    ]);
    expect(screen.getByText(/showing sample data/)).toBeInTheDocument();
    const summary = screen.getByRole("list", { name: "SLOs by verdict" });
    const items = within(summary)
      .getAllByRole("listitem")
      .map((li) => li.textContent);
    expect(items).toEqual(["1 exhausted", "1 at risk", "1 healthy", "1 no data"]);
  });

  it("marks burn rates above the alert thresholds", () => {
    render(<App />);
    const checkout = screen.getByRole("article", { name: "checkout-availability" });
    expect(within(checkout).getAllByText(/page alert/)).toHaveLength(2); // 1h and 6h
    expect(within(checkout).getByRole("meter", { name: "Error budget remaining" })).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
    const payments = screen.getByRole("article", { name: "payments-latency" });
    expect(within(payments).queryByText(/page alert/)).not.toBeInTheDocument();
    expect(within(payments).getByText(/ticket alert/)).toBeInTheDocument();
  });

  it("loads pasted JSON and reports invalid input", async () => {
    const user = userEvent.setup();
    render(<App />);
    const box = screen.getByLabelText("…or paste JSON");

    await user.type(box, "not json");
    await user.click(screen.getByRole("button", { name: "Show report" }));
    expect(screen.getByText(/Could not read the report/)).toBeInTheDocument();

    await user.clear(box);
    const report = {
      generatedAt: "2026-01-02T03:04:00Z",
      slos: [
        {
          name: "api",
          service: "api",
          objective: 99.9,
          window: "30d",
          sli: 99.95,
          budgetRemaining: 50,
          burnRates: { "1h": 0.5 },
          verdict: "HEALTHY",
        },
      ],
    };
    // user.type treats braces specially, so paste instead.
    await user.click(box);
    await user.paste(JSON.stringify(report));
    await user.click(screen.getByRole("button", { name: "Show report" }));

    expect(screen.getByRole("heading", { name: "api" })).toBeInTheDocument();
    expect(screen.queryByText(/showing sample data/)).not.toBeInTheDocument();
    expect(screen.getByText(/generated 2026-01-02 03:04 UTC/)).toBeInTheDocument();
    expect(screen.queryByText(/Could not read the report/)).not.toBeInTheDocument();
  });

  it("loads a report file", async () => {
    const user = userEvent.setup();
    render(<App />);
    const file = new File(
      [
        JSON.stringify({
          slos: [
            {
              name: "from-file",
              service: "s",
              objective: 99,
              window: "7d",
              noData: true,
              verdict: "NO DATA",
            },
          ],
        }),
      ],
      "report.json",
      { type: "application/json" },
    );
    await user.upload(screen.getByLabelText("Report file"), file);
    expect(await screen.findByRole("heading", { name: "from-file" })).toBeInTheDocument();
    expect(screen.getByText(/No traffic was recorded/)).toBeInTheDocument();
  });
});
