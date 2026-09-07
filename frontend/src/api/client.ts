import { apiUrl } from "../config/api";

interface ApiFailure {
  success?: false;
  error?: {
    code?: string;
    message?: string;
  };
}

interface ApiSuccess<T> {
  success: true;
  data: T;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export const apiRequest = async <T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> => {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(apiUrl(path), {
    cache: "no-store",
    ...options,
    headers,
  });
  const payload = (await response.json().catch(() => null)) as
    | ApiSuccess<T>
    | ApiFailure
    | null;

  if (!response.ok || !payload || payload.success !== true) {
    const failure = payload as ApiFailure | null;
    throw new ApiError(
      failure?.error?.message || "The request could not be completed",
      response.status,
      failure?.error?.code
    );
  }

  return payload.data;
};
