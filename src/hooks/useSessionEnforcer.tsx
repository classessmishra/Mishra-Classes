"use client";

import { useEffect } from "react";
import { verifySession } from "@/actions/auth";

export function useSessionEnforcer() {
  useEffect(() => {
    // Only run on the client
    if (typeof window === "undefined") return;

    let intervalId: NodeJS.Timeout;

    const enforceSession = async () => {
      try {
        // Read cookies
        const cookies = document.cookie.split("; ");
        const userIdCookie = cookies.find((row) => row.startsWith("user_id="));
        const sessionIdCookie = cookies.find((row) => row.startsWith("device_session_id="));
        const loginSourceCookie = cookies.find((row) => row.startsWith("device_login_source="));

        // Allow bypassing if it's the admin hardcoded fallback ID
        if (userIdCookie && userIdCookie.split("=")[1] === "00000000-0000-0000-0000-000000000000") {
          return;
        }

        if (userIdCookie && sessionIdCookie && loginSourceCookie) {
          const userId = userIdCookie.split("=")[1];
          const sessionId = sessionIdCookie.split("=")[1];
          const loginSource = loginSourceCookie.split("=")[1] as "app" | "web";

          const result = await verifySession(userId, sessionId, loginSource);

          if (result && !result.valid && result.reason === "session_expired") {
            // Session expired / overridden by another device
            // Clear auth cookies
            document.cookie = "auth_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = "user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = "device_session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = "device_login_source=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            
            // Redirect to login page
            window.location.href = "/login?error=session_expired";
          }
        } else if (userIdCookie && (!sessionIdCookie || !loginSourceCookie)) {
          // Legacy session where session cookies were httpOnly or missing
          // Force logout to ensure they get the new verifiable cookies
          document.cookie = "auth_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          document.cookie = "user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          window.location.href = "/login?error=session_expired";
        }
      } catch (error) {
        console.error("Session verification failed:", error);
      }
    };

    // Run immediately
    enforceSession();

    // Polling interval: Check every 10 seconds
    intervalId = setInterval(enforceSession, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);
}
