import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Dashboard from "./Dashboard";

global.fetch = vi.fn();

const overview = {
  month: "2026-09",
  totalBalance: "8071.55",
  monthlyIncome: "3200.00",
  monthlyExpenses: "128.45",
  netIncome: "3071.55",
  categorySpending: [
    { categoryId: "category-1", name: "Groceries", total: "128.45" },
  ],
  budgetProgress: [
    {
      id: "budget-1",
      categoryId: "category-1",
      name: "Monthly groceries",
      amount: "600.00",
      month: "2026-09",
      spent: "128.45",
      remaining: "471.55",
      percentage: 21.41,
      createdAt: "2026-09-01T00:00:00.000Z",
    },
  ],
  monthlyTrend: [
    { month: "2026-04", income: "0.00", expenses: "0.00", net: "0.00" },
    { month: "2026-05", income: "0.00", expenses: "0.00", net: "0.00" },
    { month: "2026-06", income: "0.00", expenses: "0.00", net: "0.00" },
    { month: "2026-07", income: "0.00", expenses: "0.00", net: "0.00" },
    { month: "2026-08", income: "0.00", expenses: "0.00", net: "0.00" },
    { month: "2026-09", income: "3200.00", expenses: "128.45", net: "3071.55" },
  ],
};

const transactions = {
  items: [
    {
      id: "transaction-1",
      accountId: "account-1",
      categoryId: "category-1",
      description: "Weekend groceries",
      type: "EXPENSE",
      status: "COMPLETED",
      amount: "128.45",
      date: "2026-09-05",
    },
  ],
};

const response = (data: unknown, status = 200): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () =>
      status >= 200 && status < 300
        ? { success: true, data }
        : { success: false, error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required" } },
  }) as Response;

const mockSuccessfulRequests = () => {
  vi.mocked(global.fetch).mockImplementation(async (input) => {
    const url = String(input);
    if (url.includes("/dashboard/overview")) return response(overview);
    if (url.includes("/transactions")) return response(transactions);
    if (url.includes("/accounts")) return response({ items: [{ id: "account-1", name: "Everyday Checking" }] });
    if (url.includes("/categories")) return response({ items: [{ id: "category-1", name: "Groceries" }] });
    throw new Error(`Unexpected request: ${url}`);
  });
};

const renderDashboard = (onUnauthorized = vi.fn()) =>
  render(
    <BrowserRouter>
      <Dashboard
        token="test-token"
        currency="USD"
        firstName="Rohan"
        onUnauthorized={onUnauthorized}
      />
    </BrowserRouter>
  );

describe("Dashboard", () => {
  beforeEach(() => {
    vi.mocked(global.fetch).mockReset();
  });

  it("shows a loading state", () => {
    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => undefined));
    renderDashboard();

    expect(screen.getByRole("status")).toHaveTextContent("Loading your finances");
  });

  it("loads authenticated dashboard data and supporting collections", async () => {
    mockSuccessfulRequests();
    renderDashboard();

    expect(await screen.findByText("Welcome back, Rohan")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(4);

    for (const [, request] of vi.mocked(global.fetch).mock.calls) {
      const headers = request?.headers as Headers;
      expect(headers.get("Authorization")).toBe("Bearer test-token");
    }
  });

  it("renders the exact financial summary returned by the API", async () => {
    mockSuccessfulRequests();
    renderDashboard();

    expect(await screen.findByText("$8,071.55")).toBeInTheDocument();
    expect(screen.getByText("$3,200.00")).toBeInTheDocument();
    expect(screen.getAllByText("$128.45").length).toBeGreaterThan(0);
    expect(screen.getByText("$3,071.55")).toBeInTheDocument();
  });

  it("renders recent transactions with resolved account and category names", async () => {
    mockSuccessfulRequests();
    renderDashboard();

    expect(await screen.findByText("Weekend groceries")).toBeInTheDocument();
    expect(screen.getByText("Everyday Checking · Groceries")).toBeInTheDocument();
  });

  it("renders budget utilization and category spending", async () => {
    mockSuccessfulRequests();
    renderDashboard();

    expect(await screen.findByText("Monthly groceries")).toBeInTheDocument();
    expect(screen.getByText("21.41% used")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: /monthly groceries budget usage/i })).toHaveAttribute(
      "aria-valuenow",
      "21.41"
    );
    expect(screen.getAllByText("Groceries").length).toBeGreaterThan(0);
  });

  it("renders the six-month cash-flow series", async () => {
    mockSuccessfulRequests();
    renderDashboard();

    expect(await screen.findByText("Six-month cash flow")).toBeInTheDocument();
    expect(screen.getByLabelText(/September 2026.*income.*expenses/i)).toBeInTheDocument();
  });

  it("reloads analytics for the selected reporting month", async () => {
    mockSuccessfulRequests();
    renderDashboard();
    await screen.findByText("Welcome back, Rohan");

    fireEvent.change(screen.getByLabelText("Reporting month"), {
      target: { value: "2026-08" },
    });

    await waitFor(() => {
      expect(
        vi.mocked(global.fetch).mock.calls.some(([url]) =>
          String(url).includes("/dashboard/overview?month=2026-08")
        )
      ).toBe(true);
    });
  });

  it("returns an expired session to authentication", async () => {
    const onUnauthorized = vi.fn();
    vi.mocked(global.fetch).mockResolvedValue(response(null, 401));
    renderDashboard(onUnauthorized);

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalled());
  });

  it("shows a recoverable error for non-authentication failures", async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error("API unavailable"));
    renderDashboard();

    expect(await screen.findByRole("alert")).toHaveTextContent("API unavailable");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
