// Web Crypto AES-GCM encrypted credential storage
// Mirrors flutter_secure_storage behaviour on web.
//
// Security model:
//   - A random AES-256-GCM key is generated on first use and stored as a JWK
//     in localStorage under STORAGE_KEYS.cryptoSalt.
//   - Each credential is encrypted with a fresh random 12-byte IV.
//   - Ciphertext is stored as base64(iv[12] + ciphertext) in localStorage.
//   - This protects against casual inspection; the key lives alongside the data
//     because the browser has no hardware-backed keystore equivalent to iOS Keychain.

import { Credential } from "@/lib/models/credential";
import { ServiceType } from "@/lib/constants/services";
import { STORAGE_KEYS } from "@/lib/constants/storageKeys";

// ── Key management ────────────────────────────────────────────────────────────

async function getOrCreateKey(): Promise<CryptoKey> {
  const stored = localStorage.getItem(STORAGE_KEYS.cryptoSalt);
  if (stored) {
    const jwk: JsonWebKey = JSON.parse(stored);
    return crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "AES-GCM" },
      true,
      ["encrypt", "decrypt"]
    );
  }

  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const jwk = await crypto.subtle.exportKey("jwk", key);
  localStorage.setItem(STORAGE_KEYS.cryptoSalt, JSON.stringify(jwk));
  return key;
}

// ── Primitives ────────────────────────────────────────────────────────────────

async function encrypt(plaintext: string): Promise<string> {
  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);

  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decrypt(stored: string): Promise<string> {
  const key = await getOrCreateKey();
  const combined = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function saveCredential(
  service: ServiceType,
  credential: Credential
): Promise<void> {
  const json = JSON.stringify(credential);
  const ciphertext = await encrypt(json);
  localStorage.setItem(STORAGE_KEYS.credentialPrefix(service), ciphertext);
}

export async function loadCredential(
  service: ServiceType
): Promise<Credential | null> {
  const stored = localStorage.getItem(STORAGE_KEYS.credentialPrefix(service));
  if (!stored) return null;
  const json = await decrypt(stored);
  return JSON.parse(json) as Credential;
}

export function deleteCredential(service: ServiceType): void {
  localStorage.removeItem(STORAGE_KEYS.credentialPrefix(service));
}

export function clearAllCredentials(): void {
  Object.values(ServiceType).forEach(deleteCredential);
  localStorage.removeItem(STORAGE_KEYS.cryptoSalt);
}
