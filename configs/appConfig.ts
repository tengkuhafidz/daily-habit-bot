import { config } from 'https://deno.land/std@0.148.0/dotenv/mod.ts';

await config({ export: true })

export const appConfig = {
    firebaseConfig: JSON.parse(Deno.env.get("FIREBASE_CONFIG") as string),
    botApiKey: Deno.env.get("BOT_API_KEY") as string
}