"use client";

import { useSessionEnforcer } from "@/hooks/useSessionEnforcer";

export default function SessionEnforcerProvider() {
  useSessionEnforcer();
  return null;
}
