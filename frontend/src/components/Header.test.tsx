import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Header from "./Header";

const user = {
  id: "user-1",
  email: "rohan@example.com",
  firstName: "Rohan",
  lastName: "Shinde",
  role: "USER",
  defaultCurrency: "USD",
  createdAt: "2026-09-01T00:00:00.000Z",
};

describe("Header", () => {
  it("renders the product and authenticated user", () => {
    render(<Header user={user} onLogout={vi.fn()} />);

    expect(screen.getByText("FinTrackr")).toBeInTheDocument();
    expect(screen.getByText("Personal Finance Workspace")).toBeInTheDocument();
    expect(screen.getByText("Rohan Shinde")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Rohan Shinde avatar" })).toHaveTextContent("RS");
    expect(screen.getByRole("button", { name: "Account menu" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  it("signs the user out from the account menu", async () => {
    const onLogout = vi.fn();
    render(<Header user={user} onLogout={onLogout} />);

    await userEvent.click(screen.getByRole("button", { name: "Account menu" }));
    expect(screen.getByText("rohan@example.com")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("uses semantic header and navigation landmarks", () => {
    render(<Header user={user} onLogout={vi.fn()} />);

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "User navigation" })).toBeInTheDocument();
  });
});
