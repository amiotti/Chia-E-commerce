import "server-only";
import { createUser, verifyUserCredentials } from "./store";

export async function registerWithInstantAuth(input: unknown) {
  return createUser(input);
}

export async function loginWithInstantAuth(input: unknown) {
  return verifyUserCredentials(input);
}
