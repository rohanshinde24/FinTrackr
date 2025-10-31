import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Dashboard from "./Dashboard.tsx";

// Mock fetch
global.fetch = jest.fn();

const mockDashboardData = {
  totalBalance: 5000,
  monthlyIncome: 3000,
  monthlyExpenses: 2000,
  netIncome: 1000,
  recentTransactions: [
    {
      id: 1,
      amount: 50.0,
      description: "Grocery shopping",
      type: "EXPENSE",
      date: "2025-10-28",
      account: { name: "Checking" },
      category: { name: "Food" },
    },
    {
      id: 2,
      amount: 1000.0,
      description: "Salary",
      type: "INCOME",
      date: "2025-10-25",
      account: { name: "Checking" },
      category: { name: "Income" },
    },
  ],
  budgetProgress: [
    {
      id: 1,
      name: "Food Budget",
      amount: 500,
      spent: 300,
      remaining: 200,
      percentage: 60,
      category: "Food",
    },
  ],
  categorySpending: [
    { categoryName: "Food", total: "300" },
    { categoryName: "Transport", total: "150" },
  ],
};

describe("Dashboard Component", () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it("displays loading state initially", () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<Dashboard />);

    expect(screen.getByText(/loading dashboard data/i)).toBeInTheDocument();
  });

  it("displays error state when fetch fails", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Failed to fetch"));

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/error loading dashboard/i)).toBeInTheDocument();
    });
  });

  it("displays dashboard data when fetch succeeds", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockDashboardData }),
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    });
  });

  it("renders financial statistics", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockDashboardData }),
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Total Balance")).toBeInTheDocument();
      expect(screen.getByText("Monthly Income")).toBeInTheDocument();
      expect(screen.getByText("Monthly Expenses")).toBeInTheDocument();
      expect(screen.getByText("Net Income")).toBeInTheDocument();
    });
  });

  it("renders recent transactions", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockDashboardData }),
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Recent Transactions")).toBeInTheDocument();
      expect(screen.getByText("Grocery shopping")).toBeInTheDocument();
      expect(screen.getByText("Salary")).toBeInTheDocument();
    });
  });

  it("renders budget progress section", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockDashboardData }),
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Budget Progress")).toBeInTheDocument();
      expect(screen.getByText("Food Budget")).toBeInTheDocument();
    });
  });

  it("renders category spending section", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockDashboardData }),
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Category Spending")).toBeInTheDocument();
      expect(screen.getByText("Food")).toBeInTheDocument();
      expect(screen.getByText("Transport")).toBeInTheDocument();
    });
  });

  it("has proper semantic HTML structure", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockDashboardData }),
    });

    const { container } = render(<Dashboard />);

    await waitFor(() => {
      const main = container.querySelector("main");
      expect(main).toHaveAttribute("role", "main");
    });
  });

  it("renders action buttons with proper accessibility", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockDashboardData }),
    });

    render(<Dashboard />);

    await waitFor(() => {
      const addTransactionBtn = screen.getByRole("button", {
        name: /add new transaction/i,
      });
      const exportDataBtn = screen.getByRole("button", {
        name: /export dashboard data/i,
      });

      expect(addTransactionBtn).toBeInTheDocument();
      expect(exportDataBtn).toBeInTheDocument();
    });
  });

  it("progress bars have proper ARIA attributes", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockDashboardData }),
    });

    render(<Dashboard />);

    await waitFor(() => {
      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toHaveAttribute("aria-valuenow", "60");
      expect(progressBar).toHaveAttribute("aria-valuemin", "0");
      expect(progressBar).toHaveAttribute("aria-valuemax", "100");
    });
  });
});

