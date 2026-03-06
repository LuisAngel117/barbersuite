import { NextResponse } from "next/server";

export function problemResponse(
  status: number,
  code: string,
  title: string,
  detail: string,
  instance?: string,
) {
  return NextResponse.json(
    {
      type: "about:blank",
      title,
      status,
      detail,
      ...(instance ? { instance } : {}),
      code,
    },
    {
      status,
      headers: {
        "content-type": "application/problem+json",
      },
    },
  );
}
