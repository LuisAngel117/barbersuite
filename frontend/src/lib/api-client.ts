import { getCsrfTokenFromDocumentCookie } from "@/lib/csrf";

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const csrfToken = getCsrfTokenFromDocumentCookie();

  if (csrfToken && !headers.has("x-csrf-token")) {
    headers.set("x-csrf-token", csrfToken);
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: "same-origin",
  });
}
