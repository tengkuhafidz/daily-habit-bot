import { Context } from "https://deno.land/x/grammy@v1.9.0/context.ts";
import { DbQueries } from "../repositories/db-queries.ts";
import { CtxDetails } from "../utils/CtxDetails.ts";
import { displayTodayStats } from "./today.ts";

export const done = async (ctx: Context) => {
    const ctxDetails = new CtxDetails(ctx)
    const { chatId, userId, userName } = ctxDetails

    const todayRecord = await DbQueries.getToday(chatId!)

    if (!todayRecord) {
        await DbQueries.createToday(chatId!)
    }

    await DbQueries.setDone(chatId!, userId!)

    const usersDone = todayRecord?.participants ?? {}
    usersDone[userId!] = true

    await ctx.reply(`Well done, ${userName}! 🎉`, {
        parse_mode: "HTML",
    });

    const currentChallenge = await DbQueries.getChallenge(chatId!)
    await displayTodayStats(ctx, currentChallenge, usersDone)
}