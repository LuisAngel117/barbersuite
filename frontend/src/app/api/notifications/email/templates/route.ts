import { forwardJson } from "@/lib/bff";

export async function GET() {
  return forwardJson({
    method: "GET",
    path: "/notifications/email/templates",
  });
}
