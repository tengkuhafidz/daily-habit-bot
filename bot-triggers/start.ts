import { Context } from "https://deno.land/x/grammy@v1.9.0/context.ts";

export const start = (ctx: Context) => {
    ctx.reply("Add this bot to a telegram group to start your group daily habit challenge!")
}