"use client";

import { useStoreUserEffect } from "~/hooks/use-store-user-effect";

export function StoreUser() {
  useStoreUserEffect();
  return null;
}
