import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useCurrentUser() {
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.current);
  return {
    user: user ?? null,
    // Still loading if query hasn't resolved OR user is authenticated but record
    // doesn't exist yet (store mutation is in flight creating it).
    isLoading: user === undefined || (isAuthenticated && user === null),
  };
}
