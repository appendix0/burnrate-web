import { ServiceType } from "@/lib/constants/services";

const ICON_PATHS: Record<ServiceType, string> = {
  [ServiceType.Anthropic]: "/icons/anthropic.svg",
  [ServiceType.OpenAI]: "/icons/openai.svg",
  [ServiceType.Gemini]: "/icons/gemini.svg",
  [ServiceType.AWS]: "/icons/aws.svg",
  [ServiceType.Oracle]: "/icons/oracle.svg",
  [ServiceType.GoogleCloud]: "/icons/googlecloud.svg",
};

export function ServiceIcon({
  service,
  className = "w-5 h-5",
}: {
  service: ServiceType;
  className?: string;
}) {
  return (
    <img
      src={ICON_PATHS[service]}
      alt={service}
      className={className}
      style={{ filter: "brightness(0) invert(1)" }}
    />
  );
}
