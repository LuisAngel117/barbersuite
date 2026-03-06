import { forwardJson } from "@/lib/bff";

type RouteContext = {
  params: Promise<{
    serviceId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { serviceId } = await context.params;

  return forwardJson({
    method: "GET",
    path: `/services/${serviceId}`,
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { serviceId } = await context.params;

  return forwardJson({
    method: "PATCH",
    path: `/services/${serviceId}`,
    request,
  });
}
