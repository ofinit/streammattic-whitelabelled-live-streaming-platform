"use client"

import { StackProvider as StackProviderBase, StackClientApp } from "@stackframe/stack"
import { stackClientConfig } from "@/lib/stack"

function createStackApp() {
  if (!stackClientConfig.projectId) return null
  return new StackClientApp({
    projectId: stackClientConfig.projectId,
    publishableClientKey: stackClientConfig.publishableClientKey,
    urls: stackClientConfig.urls,
  })
}

export function StackProvider({ children }: { children: React.ReactNode }) {
  const app = createStackApp()
  if (!app) return <>{children}</>
  return <StackProviderBase app={app}>{children}</StackProviderBase>
}
