import { Context } from "https://deno.land/x/grammy@v1.9.0/context.ts";
import moment from "https://deno.land/x/momentjs@2.29.1-deno/mod.ts";
import { DbQueries } from "../repositories/db-queries.ts";
import { CtxDetails } from "../utils/CtxDetails.ts";

export const past7Days = async (ctx: Context) => {
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
    const recordsToDate = await DbQueries.getChallengeStats(chatId!, new Date(moment().subtract(7, 'days').startOf('day').utcOffset(8).format('L')))

    const participants = currentChallenge?.participants;
    const { pastDaysRecordsByParticipants } = getPastDaysRecords(participants, recordsToDate!)

    const statsText = `📊 <b>Past 7 Days</b> | ${currentChallenge.name}
${Object.entries(pastDaysRecordsByParticipants).map(([participantId, participantRecordStreak]) => `
${`<b>${participants[participantId]}</b> ${participantRecordStreak === "✅✅✅✅✅✅✅" ? "🔥" : ""}
${participantRecordStreak}`}`).join('\n')}`

    await ctx.reply(statsText, {
        parse_mode: "HTML",
    });
}

interface PastDaysRecordsByParticipants {
    [key: string]: string
}

const getPastDaysRecords = (participants: any, recordsToDate: any[]) => {
    const pastDaysRecordsByParticipants: PastDaysRecordsByParticipants = {}
    Object.keys(participants).forEach(participantId => {
        pastDaysRecordsByParticipants[participantId as string] = ""
    })

    recordsToDate.forEach(record => {
        if (record?.participants) {
            Object.keys(participants).forEach(participantId => {
                if (record?.participants?.[participantId]) {
                    pastDaysRecordsByParticipants[participantId as string] += "✅"
                } else {
                    pastDaysRecordsByParticipants[participantId as string] += "🔘"
                }
            })
        } else {
            Object.keys(participants).forEach(participantId => {
                pastDaysRecordsByParticipants[participantId as string] += "🔘"
            })
        }
    })

    return {
        pastDaysRecordsByParticipants
    }
}

