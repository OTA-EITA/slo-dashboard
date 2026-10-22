import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { ThresholdCalculator } from "./ThresholdCalculator";

it("recalculates thresholds as the user types", async () => {
  const user = userEvent.setup();
  render(<ThresholdCalculator />);
  expect(screen.getByText("14.4x")).toBeInTheDocument();
  expect(screen.getByText("> 0.0144")).toBeInTheDocument();

  const window = screen.getByLabelText("Window");
  await user.clear(window);
  await user.type(window, "7d");
  expect(screen.getByText("3.36x")).toBeInTheDocument();

  const objective = screen.getByLabelText("Objective (%)");
  await user.clear(objective);
  await user.type(objective, "100");
  expect(screen.getByRole("alert")).toHaveTextContent(/objective must be between 0 and 100/);
});
