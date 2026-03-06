import { forwardJson, requireBranchIdOrProblem } from "@/lib/bff";

export async function GET(request: Request) {
  const { branchId, response } = await requireBranchIdOrProblem(request);
  if (response) {
    return response;
  }

  const url = new URL(request.url);
  return forwardJson({
    method: "GET",
    path: `/availability/slots${url.search}`,
    extraHeaders: {
      "X-Branch-Id": branchId,
    },
  });
}
