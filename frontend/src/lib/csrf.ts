export function getCsrfTokenFromDocumentCookie(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("bs_csrf="));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice("bs_csrf=".length));
}
