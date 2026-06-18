import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

/** Client-side guard: redirects to /login when ready and no user. */
export function useRequireAuth() {
  const { user, isReady } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (isReady && !user) {
      navigate({ to: "/login" });
    }
  }, [isReady, user, navigate]);
  return { user, isReady };
}

/** Client-side guard: redirects to / if user is already authenticated. */
export function useRedirectIfAuthenticated() {
  const { user, isReady } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (isReady && user) {
      navigate({ to: "/" });
    }
  }, [isReady, user, navigate]);
}
