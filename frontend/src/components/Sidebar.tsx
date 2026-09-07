import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  CreditCard,
  TrendingUp,
  PieChart,
  Wallet,
  BarChart3,
} from "lucide-react";

const Sidebar: React.FC = () => {
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Transactions", href: "/transactions", icon: CreditCard },
    { name: "Accounts", href: "/accounts", icon: Wallet },
    { name: "Budgets", href: "/budgets", icon: PieChart },
    { name: "Reports", href: "/reports", icon: BarChart3 },
    { name: "Analytics", href: "/analytics", icon: TrendingUp },
  ];

  return (
    <aside
      className="w-full lg:w-64 bg-white shadow-sm border-r border-gray-200 min-h-full lg:min-h-screen"
      role="complementary"
      aria-label="Main navigation"
    >
      <nav className="p-4" aria-label="Primary navigation">
        <ul className="space-y-2" role="list">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isActive
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon size={20} aria-hidden="true" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Quick Actions */}
        <section
          className="mt-8 pt-6 border-t border-gray-200"
          aria-labelledby="quick-actions-heading"
        >
          <h3
            id="quick-actions-heading"
            className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3"
          >
            Quick Actions
          </h3>
          <div
            className="space-y-2"
            role="group"
            aria-label="Quick action buttons"
          >
            <Link
              to="/transactions"
              className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Add new transaction"
            >
              <CreditCard size={20} aria-hidden="true" />
              <span>Add Transaction</span>
            </Link>
            <Link
              to="/accounts"
              className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Add new account"
            >
              <Wallet size={20} aria-hidden="true" />
              <span>Add Account</span>
            </Link>
            <Link
              to="/budgets"
              className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Create new budget"
            >
              <PieChart size={20} aria-hidden="true" />
              <span>Create Budget</span>
            </Link>
          </div>
        </section>
      </nav>
    </aside>
  );
};

export default Sidebar;
