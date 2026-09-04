import { headers } from "next/headers";
import { env } from "@/lib/env";
import { getAuth } from "./server";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
}

/**
 * The signed-in user for the current request, or null. Reading headers makes
 * the calling route dynamic, which is why only /lockin routes, the live page,
 * and API handlers call this.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!env.lockInEnabled) return null;
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image ?? null,
  };
}
