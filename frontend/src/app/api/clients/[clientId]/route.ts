import { forwardJson, requireBranchIdOrProblem } from "@/lib/bff";

type RouteContext = {
  params: Promise<{
    clientId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { clientId } = await context.params;
  const { branchId, response } = await requireBranchIdOrProblem(request);
  if (response) {
    return response;
  }

  return forwardJson({
    method: "GET",
    path: `/clients/${clientId}`,
    extraHeaders: {
      "X-Branch-Id": branchId,
    },
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { clientId } = await context.params;
  const { branchId, response } = await requireBranchIdOrProblem(request);
  if (response) {
    return response;
  }

  return forwardJson({
    method: "PATCH",
    path: `/clients/${clientId}`,
    request,
    extraHeaders: {
      "X-Branch-Id": branchId,
    },
  });
}
