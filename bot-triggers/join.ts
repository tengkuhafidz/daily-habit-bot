import { Context } from "https://deno.land/x/grammy@v1.9.0/context.ts";
import { DbQueries } from "../repositories/db-queries.ts";
import { CtxDetails } from "../utils/CtxDetails.ts";

export const join = async (ctx: Context) => {
    const ctxDetails = new CtxDetails(ctx)
    const { chatId, userId, userName } = ctxDetails

    const currentChallenge = await DbQueries.getChallenge(chatId!)
    if (!currentChallenge) {
        const challengeExistText = `No existing challenge running in this group.
To start a new challenge, type /initiate`

        await ctx.reply(challengeExistText, {
            parse_mode: "HTML",
        });
    }

    await DbQueries.joinChallenge(chatId!, userId!, userName!)

    const hasParticipant = currentChallenge.participants && Object.keys(currentChallenge.participants)?.length > 0

    const allParticipants = hasParticipant ? currentChallenge.participants : {}
    const userAlreadyExist = hasParticipant && Object.keys(currentChallenge.participants).find(participantId => participantId === userId?.toString())
    if (!userAlreadyExist) {
        allParticipants[userId!] = userName
    }

    const joinedText = `Awesome! You're in the challenge: <b>${currentChallenge.name}</b>
    
Here's the current list of participants:${Object.entries(allParticipants).map(([participantId, participantName]) => `
- <b>${(participantName as string)?.trim()}</b>`).join('')}

<b>NOTE:</b> Once you've done the challenge for the day, simply type /done`

    await ctx.reply(joinedText, {
        parse_mode: "HTML",
    });
}