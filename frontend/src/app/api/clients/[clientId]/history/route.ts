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

  const { search } = new URL(request.url);
  return forwardJson({
    method: "GET",
    path: `/clients/${clientId}/history${search}`,
    extraHeaders: {
      "X-Branch-Id": branchId,
    },
  });
}
