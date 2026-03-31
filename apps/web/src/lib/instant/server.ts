import { init } from "@instantdb/admin";
import { readInstantEnv } from "@/lib/env.server";

let adminClient: ReturnType<typeof init> | null = null;

function buildClient() {
  const { data, status } = readInstantEnv();
  if (!data || !status.configuredAdmin) return null;

  return init({
    appId: data.NEXT_PUBLIC_INSTANT_APP_ID!,
    adminToken: data.INSTANT_APP_ADMIN_TOKEN!,
    ...(data.INSTANT_API_URI ? { apiURI: data.INSTANT_API_URI } : {}),
    useDateObjects: false,
  });
}

export function createInstantAdminClient() {
  if (adminClient) return adminClient;
  adminClient = buildClient();
  return adminClient;
}

export function requireInstantAdminClient() {
  const client = createInstantAdminClient();
  if (!client) {
    throw new Error("InstantDB no está configurado (faltan NEXT_PUBLIC_INSTANT_APP_ID/INSTANT_APP_ADMIN_TOKEN).");
  }
  return client;
}

export type InstantHealthSnapshot = {
  canCreateAdminClient: boolean;
  checkedAt: string;
};

export function getInstantHealthSnapshot(): InstantHealthSnapshot {
  return {
    canCreateAdminClient: Boolean(createInstantAdminClient()),
    checkedAt: new Date().toISOString(),
  };
}
