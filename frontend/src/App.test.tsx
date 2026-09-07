import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

global.fetch = vi.fn();

const user = {
  id: "user-1",
  email: "rohan@example.com",
  firstName: "Rohan",
  lastName: "Shinde",
  role: "USER",
  defaultCurrency: "USD",
  createdAt: "2026-09-01T00:00:00.000Z",
};

const storedSession = { user, token: "stored-token" };

const response = (data: unknown): Response =>
  ({
    ok: true,
    status: 200,
    json: async () => ({ success: true, data }),
  }) as Response;

const overview = {
  month: "2026-09",
  totalBalance: "1000.00",
  monthlyIncome: "1000.00",
  monthlyExpenses: "0.00",
  netIncome: "1000.00",
  categorySpending: [],
  budgetProgress: [],
  monthlyTrend: [
    { month: "2026-04", income: "0.00", expenses: "0.00", net: "0.00" },
    { month: "2026-05", income: "0.00", expenses: "0.00", net: "0.00" },
    { month: "2026-06", income: "0.00", expenses: "0.00", net: "0.00" },
    { month: "2026-07", income: "0.00", expenses: "0.00", net: "0.00" },
    { month: "2026-08", income: "0.00", expenses: "0.00", net: "0.00" },
    { month: "2026-09", income: "1000.00", expenses: "0.00", net: "1000.00" },
  ],
};

const mockAuthenticatedApi = () => {
  vi.mocked(global.fetch).mockImplementation(async (input) => {
    const url = String(input);
    if (url.includes("/auth/profile")) return response({ user });
    if (url.includes("/dashboard/overview")) return response(overview);
    return response({ items: [] });
  });
};

describe("App", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/");
    vi.mocked(global.fetch).mockReset();
  });

  it("protects the application behind sign in", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Sign in to FinTrackr" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Primary navigation" })).not.toBeInTheDocument();
  });

  it("restores a validated session and opens the live dashboard", async () => {
    window.sessionStorage.setItem("fintrackr.auth.session.v1", JSON.stringify(storedSession));
    mockAuthenticatedApi();

    render(<App />);

    expect(screen.getByText("Restoring your FinTrackr session…")).toBeInTheDocument();
    expect(await screen.findByText("Welcome back, Rohan")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeInTheDocument();
  });

  it("shows honest placeholders for finance workspaces that are not wired yet", async () => {
    window.sessionStorage.setItem("fintrackr.auth.session.v1", JSON.stringify(storedSession));
    window.history.replaceState({}, "", "/accounts");
    mockAuthenticatedApi();

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Accounts workspace" })).toBeInTheDocument();
    expect(screen.getByText(/will be connected in the next frontend slice/i)).toBeInTheDocument();
  });

  it("returns to sign in when the user logs out", async () => {
    window.sessionStorage.setItem("fintrackr.auth.session.v1", JSON.stringify(storedSession));
    mockAuthenticatedApi();
    render(<App />);

    await screen.findByText("Welcome back, Rohan");
    await userEvent.click(screen.getByRole("button", { name: "Account menu" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));

    expect(await screen.findByRole("heading", { name: "Sign in to FinTrackr" })).toBeInTheDocument();
    expect(window.sessionStorage.getItem("fintrackr.auth.session.v1")).toBeNull();
  });
});
