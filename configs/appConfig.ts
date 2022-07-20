import { config } from 'https://deno.land/std/dotenv';

config({ export: true })

export const appConfig = {
    firebaseConfig: JSON.parse(Deno.env.get("FIREBASE_CONFIG") as string),
    botApiKey: Deno.env.get("BOT_API_KEY") as string
}