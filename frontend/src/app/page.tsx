import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth-cookie";

export default async function Home() {
  const cookieStore = await cookies();
  redirect(cookieStore.has(ACCESS_TOKEN_COOKIE) ? "/app" : "/login");
}
