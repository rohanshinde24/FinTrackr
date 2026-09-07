const apiOrigin = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export const apiUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiOrigin}/api/v1${normalizedPath}`;
};
