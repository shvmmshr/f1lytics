"use client";

import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";

/** Browser client. baseURL defaults to the current origin, which is what we want. */
export const authClient = createAuthClient({
  plugins: [magicLinkClient()],
});
