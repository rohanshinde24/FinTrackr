import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import Sidebar from "./Sidebar";

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("Sidebar Component", () => {
  it("renders all navigation links", () => {
    renderWithRouter(<Sidebar />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Transactions")).toBeInTheDocument();
    expect(screen.getByText("Accounts")).toBeInTheDocument();
    expect(screen.getByText("Budgets")).toBeInTheDocument();
    expect(screen.getByText("Reports")).toBeInTheDocument();
    expect(screen.getByText("Analytics")).toBeInTheDocument();
  });

  it("renders quick action links", () => {
    renderWithRouter(<Sidebar />);

    expect(
      screen.getByRole("link", { name: /add new transaction/i })
    ).toHaveAttribute("href", "/transactions");
    expect(
      screen.getByRole("link", { name: /add new account/i })
    ).toHaveAttribute("href", "/accounts");
    expect(
      screen.getByRole("link", { name: /create new budget/i })
    ).toHaveAttribute("href", "/budgets");
  });

  it("has proper semantic HTML structure", () => {
    const { container } = renderWithRouter(<Sidebar />);
    const aside = container.querySelector("aside");
    expect(aside).toHaveAttribute("role", "complementary");
    expect(aside).toHaveAttribute("aria-label", "Main navigation");
  });

  it("has accessible navigation", () => {
    renderWithRouter(<Sidebar />);
    const nav = screen.getByRole("navigation", { name: /primary navigation/i });
    expect(nav).toBeInTheDocument();
  });

  it("renders quick actions section with heading", () => {
    renderWithRouter(<Sidebar />);
    expect(screen.getByText("Quick Actions")).toBeInTheDocument();
  });

  it("navigation links have proper accessibility attributes", () => {
    renderWithRouter(<Sidebar />);
    const links = screen.getAllByRole("link");

    links.forEach((link) => {
      expect(link).toHaveClass("focus:outline-none", "focus:ring-2");
    });
  });

  it("renders all navigation items in a list", () => {
    renderWithRouter(<Sidebar />);
    const list = screen.getByRole("list");
    expect(list).toBeInTheDocument();
  });
});
