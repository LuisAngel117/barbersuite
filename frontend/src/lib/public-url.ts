type RequestWithHeaders = {
  headers: Headers;
  url: string;
};

export function getPublicOrigin(request: RequestWithHeaders) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.slice(0, -1);

  if (host) {
    return `${protocol}://${host}`;
  }

  return new URL(request.url).origin;
}

export function buildPublicUrl(request: RequestWithHeaders, path: string) {
  return new URL(path, `${getPublicOrigin(request)}/`);
}
