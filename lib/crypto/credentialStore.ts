// Phase 1 — Web Crypto AES-GCM encrypted localStorage
// All credentials are encrypted at rest using SubtleCrypto.
// Key is derived from a random salt stored alongside the ciphertext.
// This mirrors flutter_secure_storage behaviour on web.

import { Credential } from "@/lib/models/credential";
import { ServiceType } from "@/lib/constants/services";
import { STORAGE_KEYS } from "@/lib/constants/storageKeys";

export async function saveCredential(_service: ServiceType, _credential: Credential): Promise<void> {
  throw new Error("Not implemented — Phase 1");
}

export async function loadCredential(_service: ServiceType): Promise<Credential | null> {
  throw new Error("Not implemented — Phase 1");
}

export async function deleteCredential(_service: ServiceType): Promise<void> {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.credentialPrefix(_service));
}
