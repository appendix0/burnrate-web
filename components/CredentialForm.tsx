// Phase 2 — credential input form, variant per ServiceType
import { ServiceType } from "@/lib/constants/services";

interface CredentialFormProps {
  service: ServiceType;
  onSubmit: (values: Record<string, string>) => void;
}

export function CredentialForm({ service: _service, onSubmit: _onSubmit }: CredentialFormProps) {
  // Phase 2 implementation
  return null;
}
