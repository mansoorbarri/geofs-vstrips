import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useCurrentUser() {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const user = useQuery(api.users.current);
  return {
    user: user ?? null,
    // Loading only while auth/query state is unresolved.
    isLoading: isAuthLoading || (isAuthenticated && user === undefined),
  };
}
