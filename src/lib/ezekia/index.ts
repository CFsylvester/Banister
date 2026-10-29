import "server-only";
import { createEzekiaClient, type EzekiaClient } from "./client.ts";

export * from "./errors.ts";
export type { EzekiaClient, EzekiaPerson, EzekiaDocument, CvOptions } from "./client.ts";

let client: EzekiaClient | undefined;

/** The app's Ezekia client. EZEKIA_API_TOKEN is a server secret: set on Vercel (Production + Preview) and in .envrc. */
export function ezekia(): EzekiaClient {
  client ??= createEzekiaClient({
    token: process.env.EZEKIA_API_TOKEN ?? "",
    log: ({ method, route, status, ms }) => console.info(`ezekia ${method} ${route} ${status ?? "network-error"} ${ms}ms`),
  });
  return client;
}
