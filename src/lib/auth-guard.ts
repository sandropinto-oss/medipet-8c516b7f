import { redirect } from "@tanstack/react-router";
import { getSession } from "@/lib/storage";

export function requireAuth() {
  if (typeof window !== "undefined" && !getSession()) {
    throw redirect({ to: "/login" });
  }
}

export function redirectIfAuthenticated() {
  if (typeof window !== "undefined" && getSession()) {
    throw redirect({ to: "/" });
  }
}
