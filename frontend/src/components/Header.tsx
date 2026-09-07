import React, { useState } from "react";
import { LogOut, Mail, User, WalletCards } from "lucide-react";
import { AuthUser } from "../auth/AuthContext";

interface HeaderProps {
  user: AuthUser;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  return (
    <header
      className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur md:px-6"
      role="banner"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <WalletCards size={21} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-950 md:text-xl">
              FinTrackr
            </h1>
            <span className="hidden text-xs text-slate-500 sm:block">
              Personal Finance Workspace
            </span>
          </div>
        </div>

        <nav aria-label="User navigation">
          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Account menu"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white"
                role="img"
                aria-label={`${fullName} avatar`}
              >
                {initials || <User size={16} aria-hidden="true" />}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-semibold text-slate-800">{fullName}</span>
                <span className="block text-xs text-slate-500">{user.role.toLowerCase()}</span>
              </span>
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
                role="menu"
                aria-label="Account options"
              >
                <div className="border-b border-slate-100 px-4 py-4">
                  <p className="font-semibold text-slate-900">{fullName}</p>
                  <p className="mt-1 flex items-center gap-2 truncate text-sm text-slate-500">
                    <Mail size={14} aria-hidden="true" />
                    {user.email}
                  </p>
                </div>
                <div className="p-2">
                  <button
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onLogout();
                    }}
                  >
                    <LogOut size={17} aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
