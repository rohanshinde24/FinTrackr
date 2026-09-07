import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CreditCard,
  DollarSign,
  PiggyBank,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { ApiError, apiRequest } from "../api/client";

interface DashboardOverview {
  month: string;
  totalBalance: string;
  monthlyIncome: string;
  monthlyExpenses: string;
  netIncome: string;
  categorySpending: Array<{
    categoryId: string;
    name: string;
    total: string;
  }>;
  budgetProgress: Array<{
    id: string;
    categoryId: string;
    name: string;
    amount: string;
    month: string;
    spent: string;
    remaining: string;
    percentage: number;
    createdAt: string;
  }>;
  monthlyTrend: Array<{
    month: string;
    income: string;
    expenses: string;
    net: string;
  }>;
}

interface TransactionItem {
  id: string;
  accountId: string;
  categoryId: string | null;
  description: string;
  type: "INCOME" | "EXPENSE";
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  amount: string;
  date: string;
}

interface AccountItem {
  id: string;
  name: string;
}

interface CategoryItem {
  id: string;
  name: string;
}

interface DashboardData {
  overview: DashboardOverview;
  transactions: TransactionItem[];
  accountNames: Map<string, string>;
  categoryNames: Map<string, string>;
}

interface DashboardProps {
  token: string;
  currency: string;
  firstName: string;
  onUnauthorized: () => void;
}

const currentMonth = (): string => new Date().toISOString().slice(0, 7);

const monthLabel = (month: string): string =>
  new Date(`${month}-01T00:00:00Z`).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

const formatCurrency = (value: string, currency: string): string => {
  const amount = Number(value);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
};

const Dashboard: React.FC<DashboardProps> = ({
  token,
  currency,
  firstName,
  onUnauthorized,
}) => {
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const [overview, transactionData, accountData, categoryData] = await Promise.all([
          apiRequest<DashboardOverview>(
            `/dashboard/overview?month=${encodeURIComponent(month)}`,
            { signal: controller.signal },
            token
          ),
          apiRequest<{ items: TransactionItem[] }>(
            "/transactions?limit=5",
            { signal: controller.signal },
            token
          ),
          apiRequest<{ items: AccountItem[] }>(
            "/accounts",
            { signal: controller.signal },
            token
          ),
          apiRequest<{ items: CategoryItem[] }>(
            "/categories",
            { signal: controller.signal },
            token
          ),
        ]);

        setData({
          overview,
          transactions: transactionData.items,
          accountNames: new Map(accountData.items.map((account) => [account.id, account.name])),
          categoryNames: new Map(
            categoryData.items.map((category) => [category.id, category.name])
          ),
        });
      } catch (caught) {
        if (controller.signal.aborted) return;
        if (caught instanceof ApiError && caught.status === 401) {
          onUnauthorized();
          return;
        }
        setError(
          caught instanceof Error
            ? caught.message
            : "Your financial overview could not be loaded."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void loadDashboard();
    return () => controller.abort();
  }, [month, onUnauthorized, retry, token]);

  const trendMaximum = useMemo(() => {
    if (!data) return 1;
    return Math.max(
      1,
      ...data.overview.monthlyTrend.flatMap((item) => [
        Number(item.income),
        Number(item.expenses),
      ])
    );
  }, [data]);

  if (loading && !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <p className="mt-4 text-sm font-medium text-slate-600">Loading your finances…</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="mx-auto mt-20 max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm" role="alert">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <RefreshCw aria-hidden="true" size={22} />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">Dashboard unavailable</h2>
        <p className="mt-2 text-sm text-slate-600">{error}</p>
        <button
          type="button"
          onClick={() => setRetry((value) => value + 1)}
          className="mt-6 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { overview, transactions, accountNames, categoryNames } = data;
  const stats = [
    {
      title: "Total balance",
      value: formatCurrency(overview.totalBalance, currency),
      helper: `As of ${monthLabel(overview.month)}`,
      icon: Wallet,
      iconClass: "bg-blue-50 text-blue-600",
    },
    {
      title: "Income",
      value: formatCurrency(overview.monthlyIncome, currency),
      helper: "Completed this month",
      icon: TrendingUp,
      iconClass: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Expenses",
      value: formatCurrency(overview.monthlyExpenses, currency),
      helper: "Completed this month",
      icon: TrendingDown,
      iconClass: "bg-rose-50 text-rose-600",
    },
    {
      title: "Net income",
      value: formatCurrency(overview.netIncome, currency),
      helper: "Income minus expenses",
      icon: DollarSign,
      iconClass: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <div className="space-y-6" role="region" aria-label="Dashboard">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">Financial overview</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Welcome back, {firstName}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            A clear view of your money for {monthLabel(overview.month)}.
          </p>
        </div>
        <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
          <CalendarDays aria-hidden="true" className="text-slate-400" size={18} />
          <span className="sr-only">Reporting month</span>
          <input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="bg-transparent text-sm font-semibold outline-none"
            aria-label="Reporting month"
          />
        </label>
      </header>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="alert">
          <span>{error}</span>
          <button type="button" className="font-semibold underline" onClick={() => setRetry((value) => value + 1)}>
            Retry
          </button>
        </div>
      )}

      <section aria-labelledby="financial-summary-heading">
        <h3 id="financial-summary-heading" className="sr-only">Financial summary</h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <article key={stat.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{stat.value}</p>
                  </div>
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconClass}`}>
                    <Icon aria-hidden="true" size={21} />
                  </span>
                </div>
                <p className="mt-4 text-xs text-slate-500">{stat.helper}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="monthly-trend-heading">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 id="monthly-trend-heading" className="text-lg font-semibold text-slate-950">Six-month cash flow</h3>
            <p className="mt-1 text-sm text-slate-500">Completed income and expenses by month</p>
          </div>
          <div className="flex gap-4 text-xs font-medium text-slate-500" aria-hidden="true">
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Income</span>
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-rose-400" />Expenses</span>
          </div>
        </div>
        <div className="mt-8 grid h-56 grid-cols-6 items-end gap-3 sm:gap-6">
          {overview.monthlyTrend.map((item) => {
            const incomeHeight = Math.max(3, (Number(item.income) / trendMaximum) * 100);
            const expenseHeight = Math.max(3, (Number(item.expenses) / trendMaximum) * 100);
            return (
              <div key={item.month} className="flex h-full min-w-0 flex-col justify-end" aria-label={`${monthLabel(item.month)}: ${formatCurrency(item.income, currency)} income and ${formatCurrency(item.expenses, currency)} expenses`}>
                <div className="flex flex-1 items-end justify-center gap-1">
                  <div className="w-2.5 rounded-t-full bg-emerald-500 sm:w-4" style={{ height: `${incomeHeight}%` }} title={`Income ${formatCurrency(item.income, currency)}`} />
                  <div className="w-2.5 rounded-t-full bg-rose-400 sm:w-4" style={{ height: `${expenseHeight}%` }} title={`Expenses ${formatCurrency(item.expenses, currency)}`} />
                </div>
                <span className="mt-3 truncate text-center text-[10px] font-medium text-slate-500 sm:text-xs">
                  {monthLabel(item.month).split(" ")[0].slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="recent-transactions-heading">
          <div className="flex items-center justify-between">
            <div>
              <h3 id="recent-transactions-heading" className="text-lg font-semibold text-slate-950">Recent transactions</h3>
              <p className="mt-1 text-sm text-slate-500">Latest activity across your accounts</p>
            </div>
            <Link to="/transactions" className="text-sm font-semibold text-blue-600 hover:text-blue-700">View all</Link>
          </div>

          {transactions.length === 0 ? (
            <div className="mt-6 rounded-xl bg-slate-50 px-5 py-10 text-center">
              <CreditCard className="mx-auto text-slate-400" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium text-slate-700">No transactions yet</p>
              <p className="mt-1 text-xs text-slate-500">Your latest activity will appear here.</p>
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-slate-100">
              {transactions.map((transaction) => {
                const isIncome = transaction.type === "INCOME";
                return (
                  <li key={transaction.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isIncome ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                        {isIncome ? <ArrowUpRight aria-hidden="true" size={18} /> : <ArrowDownRight aria-hidden="true" size={18} />}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{transaction.description}</p>
                        <p className="truncate text-xs text-slate-500">
                          {accountNames.get(transaction.accountId) || "Account"} · {transaction.categoryId ? categoryNames.get(transaction.categoryId) || "Category" : "Uncategorized"}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`text-sm font-semibold ${isIncome ? "text-emerald-600" : "text-slate-800"}`}>
                        {isIncome ? "+" : "−"}{formatCurrency(transaction.amount, currency)}
                      </p>
                      <time className="text-xs text-slate-500" dateTime={transaction.date}>
                        {new Date(`${transaction.date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </time>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="budget-progress-heading">
          <div className="flex items-center justify-between">
            <div>
              <h3 id="budget-progress-heading" className="text-lg font-semibold text-slate-950">Budget progress</h3>
              <p className="mt-1 text-sm text-slate-500">Spending against your monthly limits</p>
            </div>
            <Link to="/budgets" className="text-sm font-semibold text-blue-600 hover:text-blue-700">Manage</Link>
          </div>

          {overview.budgetProgress.length === 0 ? (
            <div className="mt-6 rounded-xl bg-slate-50 px-5 py-10 text-center">
              <PiggyBank className="mx-auto text-slate-400" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium text-slate-700">No budget for this month</p>
              <p className="mt-1 text-xs text-slate-500">Create a budget to track spending progress.</p>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {overview.budgetProgress.map((budget) => {
                const progress = Math.min(Math.max(budget.percentage, 0), 100);
                const progressColor = budget.percentage >= 100 ? "bg-red-500" : budget.percentage >= 80 ? "bg-amber-500" : "bg-blue-600";
                return (
                  <div key={budget.id}>
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{budget.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatCurrency(budget.remaining, currency)} remaining</p>
                      </div>
                      <p className="text-sm font-medium text-slate-600">
                        {formatCurrency(budget.spent, currency)} <span className="text-slate-400">/ {formatCurrency(budget.amount, currency)}</span>
                      </p>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`${budget.name} budget usage`} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                      <div className={`h-full rounded-full ${progressColor}`} style={{ width: `${progress}%` }} />
                    </div>
                    <p className="mt-2 text-right text-xs font-semibold text-slate-500">{budget.percentage.toFixed(2)}% used</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="category-spending-heading">
        <div>
          <h3 id="category-spending-heading" className="text-lg font-semibold text-slate-950">Spending by category</h3>
          <p className="mt-1 text-sm text-slate-500">Where your money went in {monthLabel(overview.month)}</p>
        </div>
        {overview.categorySpending.length === 0 ? (
          <p className="mt-6 rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No completed expenses for this month.</p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {overview.categorySpending.map((category, index) => (
              <article key={category.categoryId} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-sm font-bold text-blue-600 shadow-sm">{index + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-600">{category.name}</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(category.total, currency)}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
