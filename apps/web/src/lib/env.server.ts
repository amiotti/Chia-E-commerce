import { z } from "zod";

const optionalEnvString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().optional(),
);

const supabaseEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: optionalEnvString.pipe(z.url().optional()),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalEnvString,
  SUPABASE_SERVICE_ROLE_KEY: optionalEnvString,
});

export type SupabaseEnvStatus = {
  configuredPublic: boolean;
  configuredServer: boolean;
  issues: string[];
};

export function readSupabaseEnv() {
  const parsed = supabaseEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  if (!parsed.success) {
    return {
      data: null,
      status: {
        configuredPublic: false,
        configuredServer: false,
        issues: parsed.error.issues.map((issue) => issue.message),
      } satisfies SupabaseEnvStatus,
    };
  }

  const data = parsed.data;
  const configuredPublic = Boolean(data.NEXT_PUBLIC_SUPABASE_URL && data.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const configuredServer = configuredPublic && Boolean(data.SUPABASE_SERVICE_ROLE_KEY);

  const issues: string[] = [];
  if (!configuredPublic) {
    issues.push("Faltan NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local");
  }
  if (configuredPublic && !data.SUPABASE_SERVICE_ROLE_KEY) {
    issues.push("Falta SUPABASE_SERVICE_ROLE_KEY para operaciones server privilegiadas");
  }

  return {
    data,
    status: {
      configuredPublic,
      configuredServer,
      issues,
    } satisfies SupabaseEnvStatus,
  };
}

export function maskSecret(value?: string) {
  if (!value) return null;
  if (value.length <= 8) return "********";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}