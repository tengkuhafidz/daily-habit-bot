import { Context } from "https://deno.land/x/grammy@v1.9.0/context.ts";
import { DbQueries } from "../repositories/db-queries.ts";
import { CtxDetails } from "../utils/CtxDetails.ts";
import { tzMoment } from "../utils/tzMoment.ts";
import { getStats } from "./last-month.ts";

export const stats = async (ctx: Context) => {
    const ctxDetails = new CtxDetails(ctx)
    const { chatId } = ctxDetails

    const currentChallenge = await DbQueries.getChallenge(chatId!)
    if (!currentChallenge) {
        const challengeExistText = `No existing challenge running in this group.
To start a new challenge, type /initiate`

        await ctx.reply(challengeExistText, {
            parse_mode: "HTML",
        });
    }
    const hasParticipant = currentChallenge.participants && Object.keys(currentChallenge.participants)?.length > 0;
    if (!hasParticipant) {
        const challengeExistText = `No existing participant for the current challenge.
To join the challenge, type /join`

        await ctx.reply(challengeExistText, {
            parse_mode: "HTML",
        });
    }
    const recordsToDate = await DbQueries.getChallengeStats(chatId!)

    const participants = currentChallenge?.participants;
    const { statsByParticipantIds, highScore } = getStats(participants, recordsToDate!)

    const totalDays = tzMoment().endOf('day').diff(tzMoment(undefined, currentChallenge.createdAt.toDate()).endOf('day'), "days") as number + 1;

    const statsText = `📈 <b>Overall Stats</b> | ${currentChallenge.name}
${Object.entries(statsByParticipantIds).map(([participantId, participantScore]) => `
- ${`<b>${participants[participantId]}</b>: ${participantScore}/${totalDays} ${participantScore === highScore ? "⭐️" : ""}`} `).join('')}`

    await ctx.reply(statsText, {
        parse_mode: "HTML",
    });
}