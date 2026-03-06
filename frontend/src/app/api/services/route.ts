import { forwardJson } from "@/lib/bff";

export async function GET() {
  return forwardJson({
    method: "GET",
    path: "/services",
  });
}

export async function POST(request: Request) {
  return forwardJson({
    method: "POST",
    path: "/services",
    request,
  });
}
