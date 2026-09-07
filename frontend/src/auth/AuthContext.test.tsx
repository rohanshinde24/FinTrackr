import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "./AuthContext";

global.fetch = vi.fn();

const session = {
  user: {
    id: "user-1",
    email: "old@example.com",
    firstName: "Old",
    lastName: "Name",
    role: "USER",
    defaultCurrency: "USD",
    createdAt: "2026-09-01T00:00:00.000Z",
  },
  token: "stored-token",
};

const response = (data: unknown, status = 200): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () =>
      status >= 200 && status < 300
        ? { success: true, data }
        : { success: false, error: { message: "Session expired" } },
  }) as Response;

const AuthProbe = () => {
  const { session: currentSession, checkingSession, logout } = useAuth();
  if (checkingSession) return <p>Checking session</p>;
  if (!currentSession) return <p>Signed out</p>;
  return (
    <div>
      <p>{currentSession.user.email}</p>
      <button type="button" onClick={logout}>Log out</button>
    </div>
  );
};

describe("AuthProvider", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.mocked(global.fetch).mockReset();
  });

  it("validates and refreshes a stored session", async () => {
    window.sessionStorage.setItem("fintrackr.auth.session.v1", JSON.stringify(session));
    vi.mocked(global.fetch).mockResolvedValue(
      response({ user: { ...session.user, email: "current@example.com" } })
    );

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    expect(screen.getByText("Checking session")).toBeInTheDocument();
    expect(await screen.findByText("current@example.com")).toBeInTheDocument();
    const [, options] = vi.mocked(global.fetch).mock.calls[0];
    expect((options?.headers as Headers).get("Authorization")).toBe("Bearer stored-token");
  });

  it("clears an expired stored session", async () => {
    window.sessionStorage.setItem("fintrackr.auth.session.v1", JSON.stringify(session));
    vi.mocked(global.fetch).mockResolvedValue(response(null, 401));

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    expect(await screen.findByText("Signed out")).toBeInTheDocument();
    expect(window.sessionStorage.getItem("fintrackr.auth.session.v1")).toBeNull();
  });

  it("supports an explicit logout", async () => {
    window.sessionStorage.setItem("fintrackr.auth.session.v1", JSON.stringify(session));
    vi.mocked(global.fetch).mockResolvedValue(response({ user: session.user }));

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    await screen.findByText("old@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => expect(screen.getByText("Signed out")).toBeInTheDocument());
    expect(window.sessionStorage.getItem("fintrackr.auth.session.v1")).toBeNull();
  });
});
