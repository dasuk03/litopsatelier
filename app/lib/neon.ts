import { createClient, SupabaseAuthAdapter } from "@neondatabase/neon-js";

const authUrl = process.env.NEXT_PUBLIC_NEON_AUTH_URL?.trim() ?? "";
const dataApiUrl = process.env.NEXT_PUBLIC_NEON_DATA_API_URL?.trim() ?? "";

export const isCmsConfigured = Boolean(authUrl && dataApiUrl);

export const neon = isCmsConfigured
  ? createClient({
      auth: {
        url: authUrl,
        adapter: SupabaseAuthAdapter(),
        allowAnonymous: true,
      },
      dataApi: {
        url: dataApiUrl,
      },
    })
  : null;

export function requireNeon() {
  if (!neon) {
    throw new Error("Backend Neon ещё не подключён к этой сборке");
  }
  return neon;
}
