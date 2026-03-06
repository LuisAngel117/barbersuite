import { forwardJson } from "@/lib/bff";

export async function GET(request: Request) {
  const url = new URL(request.url);

  return forwardJson({
    method: "GET",
    path: `/notifications/email/outbox${url.search}`,
  });
}
