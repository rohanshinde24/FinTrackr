import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "../auth/AuthContext";
import AuthPage from "./AuthPage";

global.fetch = vi.fn();

const authenticatedSession = {
  user: {
    id: "user-1",
    email: "rohan@example.com",
    firstName: "Rohan",
    lastName: "Shinde",
    role: "USER",
    defaultCurrency: "USD",
    createdAt: "2026-09-01T00:00:00.000Z",
  },
  token: "signed-token",
};

const apiResponse = (data: unknown, status = 200): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () =>
      status >= 200 && status < 300
        ? { success: true, data }
        : { success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } },
  }) as Response;

const renderAuthPage = () =>
  render(
    <AuthProvider>
      <AuthPage />
    </AuthProvider>
  );

describe("AuthPage", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.mocked(global.fetch).mockReset();
  });

  it("shows the sign-in form by default", () => {
    renderAuthPage();

    expect(screen.getByRole("heading", { name: "Sign in to FinTrackr" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toHaveAttribute("autocomplete", "current-password");
  });

  it("switches to account creation", async () => {
    renderAuthPage();

    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByRole("heading", { name: "Start tracking with clarity" })).toBeInTheDocument();
    expect(screen.getByLabelText("First name")).toBeInTheDocument();
    expect(screen.getByLabelText("Last name")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toHaveAttribute("autocomplete", "new-password");
  });

  it("signs in and stores the session for the browser tab", async () => {
    vi.mocked(global.fetch).mockResolvedValue(apiResponse(authenticatedSession));
    renderAuthPage();

    await userEvent.type(screen.getByLabelText("Email address"), "rohan@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "Password123!");
    await userEvent.click(
      within(screen.getByRole("form", { name: "Sign in form" })).getByRole("button", {
        name: /^sign in$/i,
      })
    );

    await waitFor(() => {
      expect(window.sessionStorage.getItem("fintrackr.auth.session.v1")).toContain("signed-token");
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "rohan@example.com", password: "Password123!" }),
      })
    );
  });

  it("submits the complete registration contract", async () => {
    vi.mocked(global.fetch).mockResolvedValue(apiResponse(authenticatedSession, 201));
    renderAuthPage();

    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    await userEvent.type(screen.getByLabelText("First name"), "Rohan");
    await userEvent.type(screen.getByLabelText("Last name"), "Shinde");
    await userEvent.type(screen.getByLabelText("Email address"), "rohan@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "Password123!");
    await userEvent.click(
      within(screen.getByRole("form", { name: "Create account form" })).getByRole(
        "button",
        { name: /^create account$/i }
      )
    );

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [, options] = vi.mocked(global.fetch).mock.calls[0];
    expect(JSON.parse(String(options?.body))).toEqual({
      email: "rohan@example.com",
      password: "Password123!",
      firstName: "Rohan",
      lastName: "Shinde",
    });
  });

  it("shows the API error when credentials are rejected", async () => {
    vi.mocked(global.fetch).mockResolvedValue(apiResponse(null, 401));
    renderAuthPage();

    await userEvent.type(screen.getByLabelText("Email address"), "wrong@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "Password123!");
    await userEvent.click(
      within(screen.getByRole("form", { name: "Sign in form" })).getByRole("button", {
        name: /^sign in$/i,
      })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
  });
});
