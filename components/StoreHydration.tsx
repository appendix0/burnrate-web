"use client";

import { useEffect } from "react";
import { useCredentialStore } from "@/lib/store/credentialStore";
import { useAlertStore } from "@/lib/store/alertStore";

// Rehydrates persisted Zustand stores from localStorage after first client render.
// Must be rendered inside the root layout to ensure stores are ready before
// any page component reads from them.
export function StoreHydration() {
  useEffect(() => {
    useCredentialStore.persist.rehydrate();
    useAlertStore.persist.rehydrate();
  }, []);

  return null;
}
