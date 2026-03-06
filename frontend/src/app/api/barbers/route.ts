import { forwardJson, requireBranchIdOrProblem } from "@/lib/bff";

export async function GET(request: Request) {
  const { branchId, response } = await requireBranchIdOrProblem(request);
  if (response) {
    return response;
  }

  return forwardJson({
    method: "GET",
    path: "/barbers",
    extraHeaders: {
      "X-Branch-Id": branchId,
    },
  });
}
