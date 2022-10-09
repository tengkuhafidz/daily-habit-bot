import { Bot } from "https://deno.land/x/grammy@v1.9.0/mod.ts";
import { CommandTriggers, CallbackTriggers, ReplyTriggers } from "./bot-triggers/index.ts";
import { setReminderTimingIfValid } from "./bot-triggers/set-reminder.ts";
import { appConfig } from "./configs/appConfig.ts";

export const bot = new Bot(appConfig.botApiKey);

// =============================================================================
// Commands
// =============================================================================

bot.api.setMyCommands([
    { command: "initiate", description: "Start a daily habit challenge" },
    { command: "join", description: "Join the challenge" },
    { command: "set_reminder", description: "Set time of day to be reminded about the challenge" },
    { command: "done", description: "Mark challenge as done" },
    { command: "today", description: "Get today's progress" },
    { command: "past7days", description: "Get records for the past 7 days" },
    { command: "last_month", description: "Get previous month's stats" },
    { command: "stats", description: "Get overall stats to date" },
    { command: "end", description: "End the current challenge" }
]);

bot.command("start", (ctx) => CommandTriggers.start(ctx));
bot.command("initiate", async (ctx) => await CommandTriggers.initiate(ctx))
bot.command("join", async (ctx) => await CommandTriggers.join(ctx))
bot.command("set_reminder", async (ctx) => await CommandTriggers.setReminder(ctx))
bot.command("today", async (ctx) => await CommandTriggers.today(ctx))
bot.command("done", async (ctx) => await CommandTriggers.done(ctx))
bot.command("past7days", async (ctx) => await CommandTriggers.past7Days(ctx))
bot.command("last_month", async (ctx) => await CommandTriggers.lastMonth(ctx))
bot.command("stats", async (ctx) => await CommandTriggers.stats(ctx))
bot.command("end", async (ctx) => await CommandTriggers.end(ctx))

// =============================================================================
// Callback Query
// =============================================================================

bot.callbackQuery("confirm-delete", async (ctx) => await CallbackTriggers.confirmDelete(ctx))
bot.callbackQuery("cancel-delete", async (ctx) => await CallbackTriggers.cancelDelete(ctx))
bot.callbackQuery("no-reminder", async (ctx) => await CallbackTriggers.noReminder(ctx))

// =============================================================================
// Catch-all Callback
// =============================================================================

bot.on("callback_query:data", async (ctx) => {
    const { data } = ctx.callbackQuery
    await setReminderTimingIfValid(ctx, data)

    await ctx.answerCallbackQuery(); // remove loading animation
});

// =============================================================================
// Catch-all Message Reply
// =============================================================================

bot.on("message", async (ctx) => {
    const replyToId = ctx.update?.message?.reply_to_message?.message_id
    if (!replyToId) {
        return
    }

    await ReplyTriggers.initiateChallengeIfValid(ctx, replyToId)
});

// =============================================================================

bot.start();
