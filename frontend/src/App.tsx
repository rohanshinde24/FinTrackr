import React from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import AuthPage from "./components/AuthPage";
import Dashboard from "./components/Dashboard";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import "./App.css";

const ComingSoon: React.FC<{ title: string; description: string }> = ({
  title,
  description,
}) => (
  <section className="mx-auto mt-16 max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
    <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">Coming next</p>
    <h2 className="mt-3 text-2xl font-bold text-slate-950">{title}</h2>
    <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
  </section>
);

const AuthenticatedApp: React.FC = () => {
  const { session, checkingSession, logout } = useAuth();

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white" role="status">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          <p className="mt-4 text-sm text-slate-300">Restoring your FinTrackr session…</p>
        </div>
      </main>
    );
  }

  if (!session) return <AuthPage />;

  const dashboard = (
    <Dashboard
      token={session.token}
      currency={session.user.defaultCurrency}
      firstName={session.user.firstName}
      onUnauthorized={logout}
    />
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={session.user} onLogout={logout} />
      <div className="flex flex-col lg:flex-row">
        <Sidebar />
        <main className="w-full flex-1 p-4 md:p-6 lg:w-auto lg:p-8">
          <Routes>
            <Route path="/" element={dashboard} />
            <Route path="/dashboard" element={dashboard} />
            <Route
              path="/transactions"
              element={<ComingSoon title="Transactions workspace" description="Transaction creation, editing, filters, and pagination will be connected in the next frontend slice." />}
            />
            <Route
              path="/accounts"
              element={<ComingSoon title="Accounts workspace" description="Account management and live balance details will be connected in the next frontend slice." />}
            />
            <Route
              path="/budgets"
              element={<ComingSoon title="Budgets workspace" description="Budget creation and management will be connected in the next frontend slice." />}
            />
            <Route
              path="/reports"
              element={<ComingSoon title="Reports" description="Downloadable reports will follow the core finance workflows." />}
            />
            <Route
              path="/analytics"
              element={<ComingSoon title="Analytics" description="Deeper analysis will build on the live dashboard metrics." />}
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <Router>
      <AuthenticatedApp />
    </Router>
  </AuthProvider>
);

export default App;
