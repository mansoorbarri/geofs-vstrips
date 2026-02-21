import { useConvexAuth, useMutation } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";

export function useStoreUserEffect() {
  const { isAuthenticated } = useConvexAuth();
  const storeUser = useMutation(api.users.store);
  const hasStored = useRef(false);
  const isStoring = useRef(false);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      hasStored.current = false;
      isStoring.current = false;
      return;
    }

    if (hasStored.current || isStoring.current) return;

    isStoring.current = true;
    let cancelled = false;

    void storeUser()
      .then(() => {
        if (cancelled) return;
        hasStored.current = true;
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error("Failed to store user. Retrying...", error);
        setTimeout(() => {
          if (!cancelled) {
            setRetryTick((prev) => prev + 1);
          }
        }, 1500);
      })
      .finally(() => {
        if (!cancelled) {
          isStoring.current = false;
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, storeUser, retryTick]);
}
