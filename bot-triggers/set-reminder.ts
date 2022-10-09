import { Context } from "https://deno.land/x/grammy@v1.9.0/context.ts";
import { InlineKeyboard } from "https://deno.land/x/grammy@v1.9.0/mod.ts";
import { DbQueries } from "../repositories/db-queries.ts";
import { CtxDetails } from "../utils/CtxDetails.ts";

export const setReminder = async (ctx: Context) => {
    const hourKeyboard = new InlineKeyboard()
        .text("12am").text("3am").text("6am").text("9am").row()
        .text("12pm").text("3pm").text("6pm").text("9pm").row()
        .text("None", "no-reminder")

    await ctx.reply("What time would you like to be reminded about this challenge daily?", {
        reply_markup: hourKeyboard,
    });
}

// =============================================================================
// Callback Query
// =============================================================================

export const noReminder = async (ctx: Context) => {
    const { chatId } = new CtxDetails(ctx)
    await DbQueries.removeReminderTiming(chatId!)
    ctx.editMessageText("Sure, I trust you to remind each other about this challenge daily 👌🏽")
};

// =============================================================================
// Catch-all Callback
// =============================================================================

export const setReminderTimingIfValid = async (ctx: Context, reminderTiming: string) => {
    if (!isReminderCallback(reminderTiming)) {
        return
    }

    const { chatId } = new CtxDetails(ctx)
    await DbQueries.saveReminderTiming(chatId!, reminderTiming)
    ctx.editMessageText(`Okay, I'll prompt every ${reminderTiming} daily ✊🏽`)
}

const isReminderCallback = (reminderTiming: string) => {
    // if time, then has to be reminder (as of this writing)
    const regexPattern = /\b((1[0-2]|0?[1-9])([ap][m]))/
    return regexPattern.test(reminderTiming)
}

