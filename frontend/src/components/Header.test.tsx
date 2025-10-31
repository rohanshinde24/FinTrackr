import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Header from "./Header.tsx";

describe("Header Component", () => {
  it("renders the FinTrackr title", () => {
    render(<Header />);
    expect(screen.getByText("FinTrackr")).toBeInTheDocument();
    expect(screen.getByText("Personal Finance Tracker")).toBeInTheDocument();
  });

  it("displays notification button with correct aria-label", () => {
    render(<Header />);
    const notificationButton = screen.getByRole("button", {
      name: /notifications.*3 unread/i,
    });
    expect(notificationButton).toBeInTheDocument();
  });

  it("displays user name", () => {
    render(<Header />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("renders user menu with proper accessibility attributes", () => {
    render(<Header />);
    const userMenuButton = screen.getByRole("button", { name: /user menu/i });
    expect(userMenuButton).toHaveAttribute("aria-haspopup", "true");
    expect(userMenuButton).toHaveAttribute("aria-expanded", "false");
  });

  it("renders all menu items", () => {
    render(<Header />);
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  it("has proper semantic HTML structure", () => {
    const { container } = render(<Header />);
    const header = container.querySelector("header");
    expect(header).toHaveAttribute("role", "banner");
  });

  it("has accessible navigation", () => {
    render(<Header />);
    const nav = screen.getByRole("navigation", { name: /user navigation/i });
    expect(nav).toBeInTheDocument();
  });
});

