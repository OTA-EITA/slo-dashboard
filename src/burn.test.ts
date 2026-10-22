import { describe, expect, it } from "vitest";
import { burnLevel, formatPercent, thresholds, windowHours } from "./burn";

describe("thresholds", () => {
  it("reproduces the SRE Workbook factors for a 30 day SLO", () => {
    const t = thresholds(99.9, "30d");
    expect(t.map((x) => x.factor)).toEqual([14.4, 6, 3, 1]);
    expect(t.map((x) => x.errorRatio)).toEqual([0.0144, 0.006, 0.003, 0.001]);
    expect(t.map((x) => `${x.longLabel}/${x.shortLabel}`)).toEqual(["1h/5m", "6h/30m", "1d/2h", "3d/6h"]);
  });

  it("scales with the SLO window and drops policies longer than it", () => {
    expect(thresholds(99, "7d")[0]?.factor).toBe(3.36);
    expect(thresholds(99, "1d").map((x) => x.longLabel)).toEqual(["1h", "6h"]);
  });

  it("rejects invalid input", () => {
    expect(() => thresholds(100, "30d")).toThrow(/objective/);
    expect(() => thresholds(0, "30d")).toThrow(/objective/);
    expect(() => thresholds(99, "monthly")).toThrow(/window/);
  });
});

describe("windowHours", () => {
  it.each([
    ["90m", 1.5],
    ["12h", 12],
    ["30d", 720],
    ["4w", 672],
  ])("%s = %d hours", (w, h) => {
    expect(windowHours(w)).toBe(h);
  });

  it("rejects zero", () => {
    expect(() => windowHours("0d")).toThrow(/positive/);
  });
});

describe("burnLevel", () => {
  it("compares against the policy for the window", () => {
    expect(burnLevel(20, "1h", "30d")).toBe("page");
    expect(burnLevel(10, "1h", "30d")).toBe("ok");
    expect(burnLevel(3.5, "1d", "30d")).toBe("ticket");
    expect(burnLevel(6, "6h", "30d")).toBe("page");
  });

  it("falls back to burn >= 1 for windows without a policy", () => {
    expect(burnLevel(1.2, "2w", "30d")).toBe("ticket");
    expect(burnLevel(0.5, "2w", "30d")).toBe("ok");
  });
});

it("formatPercent", () => {
  expect(formatPercent(99.94321, 3)).toBe("99.943%");
  expect(formatPercent(-1900)).toBe("-1900.0%");
});
