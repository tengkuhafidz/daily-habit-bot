import { Context } from "https://deno.land/x/grammy@v1.9.0/context.ts";
import { DbQueries } from "../repositories/db-queries.ts";
import { constructTaggedUserName } from "../utils/constructTaggedUserName.ts";
import { CtxDetails } from "../utils/CtxDetails.ts";
import { tzMoment } from "../utils/tzMoment.ts";

export const today = async (ctx: Context) => {
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

    const todayRecord = await DbQueries.getToday(chatId!)
    const usersDone = todayRecord?.participants;

    if (!todayRecord) {
        await DbQueries.createToday(chatId!)
    }

    await displayTodayStats(ctx, currentChallenge, usersDone)
}

export const displayTodayStats = async (ctx: Context, challenge: any, usersDone?: { [key: string]: boolean }) => {
    const numOfDays = tzMoment().endOf('day').diff(tzMoment(undefined, challenge.createdAt.toDate()).endOf('day'), "days") as number + 1;
    const challengeName = challenge.name as string;
    const allParticipants = challenge.participants as { [key: string]: string }

    const todayText = `🗓 <b>Day ${numOfDays}</b> | ${challengeName}
    
Here's the current progress:${Object.entries(allParticipants).map(([participantId, participantName]) => `
- ${usersDone?.[participantId] ? `<b>${participantName.trim()}</b> ✅` : `${constructTaggedUserName(participantName, participantId)} 🔘`}`).join('')}
    
<b>NOTE:</b> Once you've done the challenge for the day, simply type /done`

    await ctx.reply(todayText, {
        parse_mode: "HTML",
    });
}