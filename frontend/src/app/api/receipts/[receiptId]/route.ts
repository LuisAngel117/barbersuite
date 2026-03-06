import { forwardJson, requireBranchIdOrProblem } from "@/lib/bff";

type RouteContext = {
  params: Promise<{
    receiptId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { receiptId } = await context.params;
  const { branchId, response } = await requireBranchIdOrProblem(request);
  if (response) {
    return response;
  }

  return forwardJson({
    method: "GET",
    path: `/receipts/${receiptId}`,
    extraHeaders: {
      "X-Branch-Id": branchId,
    },
  });
}
