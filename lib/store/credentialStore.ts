"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ServiceType } from "@/lib/constants/services";
import { Credential } from "@/lib/models/credential";
import {
  saveCredential,
  loadCredential,
  deleteCredential,
} from "@/lib/crypto/credentialStore";
import { STORAGE_KEYS } from "@/lib/constants/storageKeys";

type CredentialStoreState = {
  // Which services have credentials saved — persisted to localStorage (plain list, no secrets)
  configuredServices: ServiceType[];

  // Save encrypted credential + mark service as configured
  addCredential: (service: ServiceType, credential: Credential) => Promise<void>;

  // Remove credential from encrypted storage + unmark service
  removeCredential: (service: ServiceType) => void;

  // Load a credential from encrypted storage (called lazily per service)
  getCredential: (service: ServiceType) => Promise<Credential | null>;
};

export const useCredentialStore = create<CredentialStoreState>()(
  persist(
    (set) => ({
      configuredServices: [],

      addCredential: async (service, credential) => {
        await saveCredential(service, credential);
        set((state) => ({
          configuredServices: state.configuredServices.includes(service)
            ? state.configuredServices
            : [...state.configuredServices, service],
        }));
      },

      removeCredential: (service) => {
        deleteCredential(service);
        set((state) => ({
          configuredServices: state.configuredServices.filter((s) => s !== service),
        }));
      },

      getCredential: (service) => loadCredential(service),
    }),
    {
      name: STORAGE_KEYS.configuredServices,
      // Only persist the list of configured services, not the credentials themselves
      // (credentials are in their own encrypted localStorage entries)
      partialize: (state) => ({ configuredServices: state.configuredServices }),
      skipHydration: true,
    }
  )
);
