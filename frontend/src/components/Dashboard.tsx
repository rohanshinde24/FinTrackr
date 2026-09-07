import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { apiUrl } from "../config/api";

interface DashboardData {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netIncome: number;
  recentTransactions: Array<{
    id: number;
    amount: number;
    description: string;
    type: string;
    date: string;
    account: { name: string };
    category: { name: string };
  }>;
  budgetProgress: Array<{
    id: number;
    name: string;
    amount: number;
    spent: number;
    remaining: number;
    percentage: number;
    category: string;
  }>;
  categorySpending: Array<{
    categoryName: string;
    total: string;
  }>;
}

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(apiUrl("/dashboard/overview"));
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }
        const result = await response.json();
        if (result.success) {
          setDashboardData(result.data);
        } else {
          throw new Error("API returned error");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-64"
        role="status"
        aria-live="polite"
      >
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
          aria-hidden="true"
        ></div>
        <span className="sr-only">Loading dashboard data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-red-50 border border-red-200 rounded-lg p-4"
        role="alert"
        aria-live="assertive"
      >
        <p className="text-red-600">Error loading dashboard: {error}</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div
        className="bg-gray-50 border border-gray-200 rounded-lg p-4"
        role="status"
      >
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Balance",
      value: `$${dashboardData.totalBalance.toLocaleString()}`,
      change: "+2.5%",
      changeType: "positive" as const,
      icon: DollarSign,
    },
    {
      title: "Monthly Income",
      value: `$${dashboardData.monthlyIncome.toLocaleString()}`,
      change: "+5.2%",
      changeType: "positive" as const,
      icon: TrendingUp,
    },
    {
      title: "Monthly Expenses",
      value: `$${dashboardData.monthlyExpenses.toLocaleString()}`,
      change: "-1.8%",
      changeType: "negative" as const,
      icon: TrendingDown,
    },
    {
      title: "Net Income",
      value: `$${dashboardData.netIncome.toLocaleString()}`,
      change: "+8.3%",
      changeType: "positive" as const,
      icon: CreditCard,
    },
  ];

  return (
    <main className="space-y-6" role="main" aria-label="Dashboard">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Welcome back! Here's your financial overview.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm md:text-base"
            type="button"
            aria-label="Add new transaction"
          >
            Add Transaction
          </button>
          <button
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm md:text-base"
            type="button"
            aria-label="Export dashboard data"
          >
            Export Data
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          Financial Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <article
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                aria-label={`${stat.title}: ${stat.value}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg" aria-hidden="true">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="flex items-center mt-4">
                  {stat.changeType === "positive" ? (
                    <ArrowUpRight
                      className="h-4 w-4 text-green-500"
                      aria-hidden="true"
                    />
                  ) : (
                    <ArrowDownRight
                      className="h-4 w-4 text-red-500"
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={`text-sm font-medium ml-1 ${
                      stat.changeType === "positive"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                    aria-label={`${stat.change} change compared to last month`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">
                    vs last month
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <section
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          aria-labelledby="recent-transactions-heading"
        >
          <div className="flex items-center justify-between mb-6">
            <h2
              id="recent-transactions-heading"
              className="text-lg font-semibold text-gray-900"
            >
              Recent Transactions
            </h2>
            <button
              className="text-blue-600 hover:text-blue-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              type="button"
              aria-label="View all transactions"
            >
              View All
            </button>
          </div>
          <ul className="space-y-4" role="list">
            {dashboardData.recentTransactions.map((transaction) => (
              <li
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg ${
                      transaction.type === "INCOME"
                        ? "bg-green-100"
                        : "bg-red-100"
                    }`}
                    aria-hidden="true"
                  >
                    {transaction.type === "INCOME" ? (
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {transaction.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      {transaction.account.name} • {transaction.category.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      transaction.type === "INCOME"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                    aria-label={`${
                      transaction.type === "INCOME" ? "Income" : "Expense"
                    } of $${Math.abs(transaction.amount).toLocaleString()}`}
                  >
                    {transaction.type === "INCOME" ? "+" : "-"}$
                    {Math.abs(transaction.amount).toLocaleString()}
                  </p>
                  <time
                    className="text-sm text-gray-500"
                    dateTime={transaction.date}
                  >
                    {new Date(transaction.date).toLocaleDateString()}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Budget Progress */}
        <section
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          aria-labelledby="budget-progress-heading"
        >
          <div className="flex items-center justify-between mb-6">
            <h2
              id="budget-progress-heading"
              className="text-lg font-semibold text-gray-900"
            >
              Budget Progress
            </h2>
            <button
              className="text-blue-600 hover:text-blue-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              type="button"
              aria-label="Manage budgets"
            >
              Manage Budgets
            </button>
          </div>
          <div className="space-y-4">
            {dashboardData.budgetProgress.map((budget) => (
              <div
                key={budget.id}
                className="space-y-2"
                role="group"
                aria-label={`${budget.name} budget progress`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {budget.name}
                  </span>
                  <span className="text-sm text-gray-500">
                    ${budget.spent.toLocaleString()} / $
                    {budget.amount.toLocaleString()}
                  </span>
                </div>
                <div
                  className="w-full bg-gray-200 rounded-full h-2"
                  role="progressbar"
                  aria-valuenow={budget.percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${budget.name} budget usage`}
                >
                  <div
                    className={`h-2 rounded-full transition-all ${
                      budget.percentage > 80
                        ? "bg-red-500"
                        : budget.percentage > 60
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{budget.percentage}% used</span>
                  <span>${budget.remaining.toLocaleString()} remaining</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Category Spending */}
      <section
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        aria-labelledby="category-spending-heading"
      >
        <div className="flex items-center justify-between mb-6">
          <h2
            id="category-spending-heading"
            className="text-lg font-semibold text-gray-900"
          >
            Category Spending
          </h2>
          <button
            className="text-blue-600 hover:text-blue-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            type="button"
            aria-label="View detailed category spending"
          >
            View Details
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="list">
          {dashboardData.categorySpending.map((category, index) => (
            <div
              key={index}
              className="text-center p-4 bg-gray-50 rounded-lg"
              role="listitem"
              aria-label={`${category.categoryName}: $${category.total}`}
            >
              <p className="text-sm text-gray-600 mb-1">
                {category.categoryName}
              </p>
              <p className="text-lg font-semibold text-gray-900">
                ${category.total}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Dashboard;
