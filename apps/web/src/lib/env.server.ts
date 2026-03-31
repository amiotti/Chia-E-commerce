import { z } from "zod";

const optionalEnvString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().optional(),
);

const instantEnvSchema = z.object({
  NEXT_PUBLIC_INSTANT_APP_ID: optionalEnvString,
  INSTANT_APP_ADMIN_TOKEN: optionalEnvString,
  INSTANT_API_URI: optionalEnvString.pipe(z.url().optional()),
});

export type InstantEnvStatus = {
  configuredPublic: boolean;
  configuredAdmin: boolean;
  issues: string[];
};

export function readInstantEnv() {
  const parsed = instantEnvSchema.safeParse({
    NEXT_PUBLIC_INSTANT_APP_ID: process.env.NEXT_PUBLIC_INSTANT_APP_ID,
    INSTANT_APP_ADMIN_TOKEN: process.env.INSTANT_APP_ADMIN_TOKEN,
    INSTANT_API_URI: process.env.INSTANT_API_URI,
  });

  if (!parsed.success) {
    return {
      data: null,
      status: {
        configuredPublic: false,
        configuredAdmin: false,
        issues: parsed.error.issues.map((issue) => issue.message),
      } satisfies InstantEnvStatus,
    };
  }

  const data = parsed.data;
  const configuredPublic = Boolean(data.NEXT_PUBLIC_INSTANT_APP_ID);
  const configuredAdmin = configuredPublic && Boolean(data.INSTANT_APP_ADMIN_TOKEN);

  const issues: string[] = [];
  if (!configuredPublic) {
    issues.push("Falta NEXT_PUBLIC_INSTANT_APP_ID en .env.local");
  }
  if (configuredPublic && !data.INSTANT_APP_ADMIN_TOKEN) {
    issues.push("Falta INSTANT_APP_ADMIN_TOKEN para operaciones server privilegiadas");
  }

  return {
    data,
    status: {
      configuredPublic,
      configuredAdmin,
      issues,
    } satisfies InstantEnvStatus,
  };
}

export function maskSecret(value?: string) {
  if (!value) return null;
  if (value.length <= 8) return "********";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}
