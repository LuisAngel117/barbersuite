import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth-cookie";
import { BRANCH_COOKIE } from "@/lib/branch-cookie";
import {
  buildBackendUrl,
  readJson,
  type MePayload,
  type ProblemPayload,
} from "@/lib/backend";

type DashboardContextResult = {
  payload: MePayload | null;
  problem: ProblemPayload | null;
};

const loadMePayload = cache(async (accessToken: string): Promise<DashboardContextResult> => {
  const backendResponse = await fetch(buildBackendUrl("/me"), {
    method: "GET",
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (backendResponse.status === 401) {
    redirect("/api/auth/logout?next=%2Flogin%3Fexpired%3D1");
  }

  const payload = await readJson<MePayload | ProblemPayload>(backendResponse);
  if (backendResponse.ok && payload && "tenant" in payload) {
    return {
      payload,
      problem: null,
    };
  }

  return {
    payload: null,
    problem: payload && !("tenant" in payload) ? payload : null,
  };
});

export async function getDashboardContext() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    redirect("/login");
  }

  const selectedBranchId = cookieStore.get(BRANCH_COOKIE)?.value ?? null;
  const result = await loadMePayload(accessToken);

  return {
    selectedBranchId,
    ...result,
  };
}
