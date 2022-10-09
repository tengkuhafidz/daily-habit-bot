import { Context } from "https://deno.land/x/grammy@v1.9.0/context.ts";
import { InlineKeyboard } from "https://deno.land/x/grammy@v1.9.0/mod.ts";
import { DbQueries } from "../repositories/db-queries.ts";
import { CtxDetails } from "../utils/CtxDetails.ts";

export const end = async (ctx: Context) => {
    const inlineKeyboard = new InlineKeyboard()
        .text("Yes", "confirm-delete")
        .text("No", "cancel-delete")

    const endPromptText = `Are you sure you want to end the current challenge?
NOTE: All your data relating to the current challenge will be deleted upon this action.`

    await ctx.reply(endPromptText, {
        reply_markup: inlineKeyboard,
    });
}

// =============================================================================
// Callback Query
// =============================================================================

export const cancelDelete = async (ctx: Context) => {
    ctx.editMessageText("Cancelled. The current challenge resumes!")

    await ctx.answerCallbackQuery({
        text: "Cancel ending challenge",
    });
}

export const confirmDelete = async (ctx: Context) => {
    await endChallenge(ctx)
    ctx.editMessageText("Ended previous challenge. To start a new challenge, type /initiate")

    await ctx.answerCallbackQuery({
        text: "Challenge ended!",
    });
}

const endChallenge = async (ctx: Context) => {
    const ctxDetails = new CtxDetails(ctx)
    const { chatId } = ctxDetails
    await DbQueries.deleteChallenge(chatId!)
}
