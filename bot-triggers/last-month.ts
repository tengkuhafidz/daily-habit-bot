import { Context } from "https://deno.land/x/grammy@v1.9.0/context.ts";
import moment from "https://deno.land/x/momentjs@2.29.1-deno/mod.ts";
import { DbQueries } from "../repositories/db-queries.ts";
import { CtxDetails } from "../utils/CtxDetails.ts";

export const lastMonth = async (ctx: Context) => {
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

    const firstDayPrevMonth = new Date(moment().subtract(1, 'months').startOf('month').utc().format())
    const lastDayPrevMonth = new Date(moment().subtract(1, 'months').endOf('month').utc().format())
    console.log("firstDayPrevMonth", firstDayPrevMonth)
    console.log("lastDayPrevMonth", lastDayPrevMonth)

    const recordsPrevMonth = await DbQueries.getChallengeStats(chatId!, firstDayPrevMonth, lastDayPrevMonth)
    console.log("1st record", recordsPrevMonth?.[0])
    console.log("last record", recordsPrevMonth?.[recordsPrevMonth?.length - 1])

    const participants = currentChallenge?.participants;
    const { statsByParticipantIds, highScore } = getStats(participants, recordsPrevMonth!)

    const prevMonthName = moment().subtract(1, 'months').format('MMMM');
    const daysInMonth = moment().subtract(1, 'months').endOf('month').diff(moment().subtract(1, 'months').startOf('month'), 'days') + 1
    const statsText = `📈 <b>${prevMonthName} Stats</b> | ${currentChallenge.name}
${Object.entries(statsByParticipantIds).map(([participantId, participantScore]) => `
- ${`<b>${participants[participantId]}</b>: ${participantScore}/${daysInMonth} ${participantScore === highScore ? "⭐️" : ""}`} `).join('')}`

    await ctx.reply(statsText, {
        parse_mode: "HTML",
    });
}


export interface StatsByParticipants {
    [key: string]: number
}

export const getStats = (participants: any, recordsToDate: any[]) => {
    const statsByParticipantIds: StatsByParticipants = {}
    Object.keys(participants).forEach(participantId => {
        statsByParticipantIds[participantId as string] = 0
    })

    recordsToDate.forEach(record => {
        if (record?.participants) {
            Object.keys(record?.participants).forEach(participantId => {
                statsByParticipantIds[participantId as string] = statsByParticipantIds[participantId as string] + 1
            })
        }
    })

    let highScore = 0
    Object.values(statsByParticipantIds).forEach(score => {
        if (score > highScore) {
            highScore = score
        }
    })

    return {
        statsByParticipantIds,
        highScore
    }
}