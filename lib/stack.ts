import { StackServerApp, StackClientApp } from "@stackframe/stack"

const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID!
const secretServerKey = process.env.STACK_SECRET_SERVER_KEY
const publishableClientKey = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY

const handlerUrls = {
  handler: "/handler",
  signIn: "/handler/signin",
  signUp: "/handler/signup",
  afterSignIn: "/login/callback",
  afterSignUp: "/login/callback",
  signOut: "/login",
  afterSignOut: "/login",
  home: "/streamer",
}

/** Server-side Stack app (use in API routes / server components) */
export function getStackServerApp(request?: { headers: { get: (name: string) => string | null } }) {
  if (!projectId || !secretServerKey) return null
  return new StackServerApp({
    projectId,
    secretServerKey,
    urls: handlerUrls,
    ...(request && { tokenStore: request }),
  })
}

/** Client-side Stack app config for StackProvider */
export const stackClientConfig = {
  projectId: projectId || "",
  publishableClientKey: publishableClientKey || undefined,
  urls: handlerUrls,
}
