import React from "react";
import { Bell, User, Settings, LogOut } from "lucide-react";

const Header: React.FC = () => {
  return (
    <header
      className="bg-white shadow-sm border-b border-gray-200 px-4 md:px-6 py-3 md:py-4"
      role="banner"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 md:space-x-4">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            FinTrackr
          </h1>
          <span className="text-xs md:text-sm text-gray-500 hidden sm:inline">
            Personal Finance Tracker
          </span>
        </div>

        <nav
          className="flex items-center space-x-4"
          aria-label="User navigation"
        >
          {/* Notifications */}
          <button
            className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
            aria-label="Notifications. You have 3 unread notifications"
            type="button"
          >
            <Bell size={20} aria-hidden="true" />
            <span
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
              aria-label="3 unread"
            >
              3
            </span>
          </button>

          {/* User Menu */}
          <div className="relative group">
            <button
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="User menu"
              aria-haspopup="true"
              aria-expanded="false"
              type="button"
            >
              <div
                className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center"
                role="img"
                aria-label="User avatar"
              >
                <User size={16} className="text-white" aria-hidden="true" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                John Doe
              </span>
            </button>

            {/* Dropdown Menu */}
            <div
              className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
              role="menu"
              aria-label="User menu options"
            >
              <div className="py-1">
                <button
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 text-left"
                  role="menuitem"
                  type="button"
                >
                  <User size={16} aria-hidden="true" />
                  <span>Profile</span>
                </button>
                <button
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 text-left"
                  role="menuitem"
                  type="button"
                >
                  <Settings size={16} aria-hidden="true" />
                  <span>Settings</span>
                </button>
                <hr className="my-1" role="separator" />
                <button
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 focus:outline-none focus:bg-red-50 text-left"
                  role="menuitem"
                  type="button"
                >
                  <LogOut size={16} aria-hidden="true" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
