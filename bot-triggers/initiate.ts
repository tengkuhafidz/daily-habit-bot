import { Context } from "https://deno.land/x/grammy@v1.9.0/context.ts";
import { DbQueries } from "../repositories/db-queries.ts";
import { CtxDetails } from "../utils/CtxDetails.ts";

let initiatePromptId: number

export const initiate = async (ctx: Context) => {
    const ctxDetails = new CtxDetails(ctx)
    const { chatId } = ctxDetails

    const existingChallenge = await DbQueries.getChallenge(chatId!);
    if (existingChallenge) {
        await rejectNewChallenge(ctx, existingChallenge.name)
        return
    }

    const initiatePrompt = await ctx.reply("What daily habit challenge do you want to start?", {
        reply_markup: { force_reply: true },
    });

    initiatePromptId = initiatePrompt?.message_id
}

const rejectNewChallenge = async (ctx: Context, existingChallengeName: string) => {
    const challengeExistText = `This group already have an existing challenge running: <b>${existingChallengeName}</b>.
To start a new challenge, end the current one with /end`

    await ctx.reply(challengeExistText, {
        parse_mode: "HTML",
    });
}

// =============================================================================
// Catch-all Message Reply
// =============================================================================

export const initiateChallengeIfValid = async (ctx: Context, replyToId: number) => {
    if (initiatePromptId !== replyToId) {
        return
    }

    const ctxDetails = new CtxDetails(ctx)
    const { messageText: newChallengeName, chatId } = ctxDetails
    if (!newChallengeName || !chatId) {
        return
    }

    await DbQueries.saveChallenge(chatId!, newChallengeName!)

    const replyText = `Daily challenge started: <b>${newChallengeName!}</b>
To join the challenge, type /join`

    await ctx.reply(replyText, {
        parse_mode: "HTML",
    });
}





