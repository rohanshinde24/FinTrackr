import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header.tsx";
import Sidebar from "./components/Sidebar.tsx";
import Dashboard from "./components/Dashboard.tsx";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-col lg:flex-row">
          <Sidebar />
          <main className="flex-1 p-4 md:p-6 w-full lg:w-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route
                path="/transactions"
                element={<div>Transactions Page</div>}
              />
              <Route path="/accounts" element={<div>Accounts Page</div>} />
              <Route path="/budgets" element={<div>Budgets Page</div>} />
              <Route path="/reports" element={<div>Reports Page</div>} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
