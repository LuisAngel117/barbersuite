import { forwardJson, requireBranchIdOrProblem } from "@/lib/bff";

export async function GET(request: Request) {
  const { branchId, response } = await requireBranchIdOrProblem(request);
  if (response) {
    return response;
  }

  return forwardJson({
    method: "GET",
    path: "/clients",
    extraHeaders: {
      "X-Branch-Id": branchId,
    },
  });
}

export async function POST(request: Request) {
  const { branchId, response } = await requireBranchIdOrProblem(request);
  if (response) {
    return response;
  }

  return forwardJson({
    method: "POST",
    path: "/clients",
    request,
    extraHeaders: {
      "X-Branch-Id": branchId,
    },
  });
}
