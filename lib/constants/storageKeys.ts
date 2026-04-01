import { ServiceType } from "./services";

export const STORAGE_KEYS = {
  credentialPrefix: (service: ServiceType) => `burnrate_cred_${service}`,
  configuredServices: "burnrate_configured_services",
  budgetAlerts: "burnrate_budget_alerts",
  cryptoSalt: "burnrate_crypto_salt",
} as const;
