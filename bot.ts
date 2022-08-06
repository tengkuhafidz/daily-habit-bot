import { Bot, Context, InlineKeyboard, Keyboard } from "https://deno.land/x/grammy@v1.9.0/mod.ts";
import { appConfig } from "./configs/appConfig.ts";
import { queries } from "./repositories/queries.ts";
import { InitiateChallenge } from "./services/InitiateChallenge.ts";
import { constructTaggedUserName } from "./utils/constructTaggedUserName.ts";
import { CtxDetails } from "./utils/CtxDetails.ts";
import { tzMoment } from "./utils/tzMoment.ts";

export const bot = new Bot(appConfig.botApiKey);

/* -------------------------------------------------------------------------- */
/*                                Bot Commands                                */
/* -------------------------------------------------------------------------- */

bot.command("start", (ctx) => ctx.reply("Welcome. You can create daily habit challenges in your telegram groups"));

bot.api.setMyCommands([
    { command: "initiate", description: "Start a daily habit challenge" },
    { command: "join", description: "Join the challenge" },
    { command: "set_reminder", description: "Set time of day to be reminded about the challenge" },
    { command: "done", description: "Mark challenge as done" },
    { command: "today", description: "Get today's progress" },
    { command: "past7days", description: "Get records for the past 7 days" },
    { command: "stats", description: "Get overall stats to date" },
    { command: "end", description: "End the current challenge" }
]);

/* -------------------------------------------------------------------------- */
/*                            Initiate Challenge                              */
/* -------------------------------------------------------------------------- */

let initiatePromptId: number;

bot.command("initiate", async (ctx) => {
    const ctxDetails = new CtxDetails(ctx)
    const { chatId } = ctxDetails

    const existingChallenge = await queries.getChallenge(chatId!);
    if (existingChallenge) {
        await rejectNewChallenge(ctx, existingChallenge.name)
        return
    }

    const initiatePrompt = await ctx.reply("What daily habit challenge do you want to start?", {
        reply_markup: { force_reply: true },
    });

    initiatePromptId = initiatePrompt?.message_id
});

const rejectNewChallenge = async (ctx: Context, existingChallengeName: string) => {
    const challengeExistText = `This group already have an existing challenge running: *${existingChallengeName}*\\.
To start a new challenge, end the current one with /end`

    await ctx.reply(challengeExistText, {
        parse_mode: "MarkdownV2",
    });
}

/* -------------------------------------------------------------------------- */
/*                               Join Challenge                               */
/* -------------------------------------------------------------------------- */

bot.command("join", async (ctx) => {
    const ctxDetails = new CtxDetails(ctx)
    const { chatId, userId, userName } = ctxDetails

    const currentChallenge = await queries.getChallenge(chatId!)
    if (!currentChallenge) {
        const challengeExistText = `No existing challenge running in this group\\.
To start a new challenge, type /initiate`

        await ctx.reply(challengeExistText, {
            parse_mode: "MarkdownV2",
        });
    }

    await queries.joinChallenge(chatId!, userId!, userName!)

    const hasParticipant = currentChallenge.participants && Object.keys(currentChallenge.participants)?.length > 0

    const allParticipants = hasParticipant ? currentChallenge.participants : {}
    const userAlreadyExist = hasParticipant && Object.keys(currentChallenge.participants).find(participantId => participantId === userId?.toString())
    if (!userAlreadyExist) {
        allParticipants[userId!] = userName
    }

    const joinedText = `Awesome\\! You're in the challenge\\.

Here's the current list of participants:${Object.entries(allParticipants).map(([participantId, participantName]) => `
\\- *${participantName}*`).join('')}

*NOTE:* Once you've done the challenge for the day, simply type /done`

    await ctx.reply(joinedText, {
        parse_mode: "MarkdownV2",
    });
});

/* -------------------------------------------------------------------------- */
/*                                Set Reminder                                */
/* -------------------------------------------------------------------------- */


bot.command("set_reminder", async (ctx) => {
    const hourKeyboard = new InlineKeyboard()
        .text("12am").text("3am").text("6am").text("9am").row()
        .text("12pm").text("3pm").text("6pm").text("9pm").row()
        .text("None", "no-reminder")

    await ctx.reply("What time would you like to be reminded about this challenge daily?", {
        reply_markup: hourKeyboard,
    });
});

const isReminderCallback = (callbackData: string) => {
    const regexPattern = /\b((1[0-2]|0?[1-9])([ap][m]))/
    return regexPattern.test(callbackData)
}

const setReminderTiming = async (ctx: Context, reminderTiming: string) => {
    const {chatId} = new CtxDetails(ctx)
    await queries.saveReminderTiming(chatId!, reminderTiming)
    ctx.editMessageText(`Okay, I'll prompt every ${reminderTiming} daily ✊🏽`)
}

bot.callbackQuery("no-reminder", async (ctx) => {
    const {chatId} = new CtxDetails(ctx)
    await queries.removeReminderTiming(chatId!)
    ctx.editMessageText("Sure, I trust you to remind each other about this challenge daily 👌🏽")
});


/* -------------------------------------------------------------------------- */
/*                                Stats Today                                 */
/* -------------------------------------------------------------------------- */

bot.command("today", async (ctx) => {
    await runToday(ctx)
});

const runToday = async (ctx: Context) => {
    const ctxDetails = new CtxDetails(ctx)
    const { chatId } = ctxDetails

    const currentChallenge = await queries.getChallenge(chatId!)
    if (!currentChallenge) {
        const challengeExistText = `No existing challenge running in this group\\.
To start a new challenge, type /initiate`

        await ctx.reply(challengeExistText, {
            parse_mode: "MarkdownV2",
        });
    }
    const hasParticipant = currentChallenge.participants && Object.keys(currentChallenge.participants)?.length > 0;
    if (!hasParticipant) {
        const challengeExistText = `No existing participant for the current challenge\\.
To join the challenge, type /join`

        await ctx.reply(challengeExistText, {
            parse_mode: "MarkdownV2",
        });
    }

    const todayRecord = await queries.getToday(chatId!)
    const usersDone = todayRecord?.participants;

    if (!todayRecord) {
        await queries.createToday(chatId!)
    }

    await displayTodayStats(ctx, currentChallenge.participants, usersDone)
}

const displayTodayStats = async (ctx: Context, allParticipants: { [key: string]: string }, usersDone?: { [key: string]: boolean }) => {

    const todayText = `Here's the current progress for today:${Object.entries(allParticipants).map(([participantId, participantName]) => `
\\- ${usersDone?.[participantId] ? `*${participantName}* ✅` : `${constructTaggedUserName(participantName, participantId)} 🔘`}`).join('')}
    
*NOTE:* Once you've done the challenge for the day, simply type /done`

    await ctx.reply(todayText, {
        parse_mode: "MarkdownV2",
    });
}

/* -------------------------------------------------------------------------- */
/*                                   Set Done                                 */
/* -------------------------------------------------------------------------- */

bot.command("done", async (ctx) => {
    const ctxDetails = new CtxDetails(ctx)
    const { chatId, userId, userName } = ctxDetails

    const todayRecord = await queries.getToday(chatId!)

    if (!todayRecord) {
        await queries.createToday(chatId!)
    }

    await queries.setDone(chatId!, userId!)

    const usersDone = todayRecord?.participants ?? {}
    usersDone[userId!] = true

    await ctx.reply(`Well done, ${userName}\\! 🎉`, {
        parse_mode: "MarkdownV2",
    });

    const currentChallenge = await queries.getChallenge(chatId!)
    await displayTodayStats(ctx, currentChallenge.participants, usersDone)
});

/* -------------------------------------------------------------------------- */
/*                                 Past 7 Days                                */
/* -------------------------------------------------------------------------- */

bot.command("past7days", async (ctx) => {
    const ctxDetails = new CtxDetails(ctx)
    const { chatId } = ctxDetails

    const currentChallenge = await queries.getChallenge(chatId!)
    if (!currentChallenge) {
        const challengeExistText = `No existing challenge running in this group\\.
To start a new challenge, type /initiate`

        await ctx.reply(challengeExistText, {
            parse_mode: "MarkdownV2",
        });
    }
    const hasParticipant = currentChallenge.participants && Object.keys(currentChallenge.participants)?.length > 0;
    if (!hasParticipant) {
        const challengeExistText = `No existing participant for the current challenge\\.
To join the challenge, type /join`

        await ctx.reply(challengeExistText, {
            parse_mode: "MarkdownV2",
        });
    }
    const recordsToDate = await queries.getChallengeStatsToDate(chatId!, new Date(tzMoment().subtract(7, 'days').format('L')))

    const participants = currentChallenge?.participants;
    const { pastDaysRecordsByParticipants } = getPastDaysRecords(participants, recordsToDate!)

    const statsText = `Records for the past 7 days:
${Object.entries(pastDaysRecordsByParticipants).map(([participantId, participantRecordStreak]) => `
${`*${participants[participantId]}* ${participantRecordStreak === "✅✅✅✅✅✅✅" ? "🔥" : ""}
${participantRecordStreak}`}`).join('\n')}`

    await ctx.reply(statsText, {
        parse_mode: "MarkdownV2",
    });
})

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



/* -------------------------------------------------------------------------- */
/*                                Stats To Date                               */
/* -------------------------------------------------------------------------- */

bot.command("stats", async (ctx) => {
    const ctxDetails = new CtxDetails(ctx)
    const { chatId } = ctxDetails

    const currentChallenge = await queries.getChallenge(chatId!)
    if (!currentChallenge) {
        const challengeExistText = `No existing challenge running in this group\\.
To start a new challenge, type /initiate`

        await ctx.reply(challengeExistText, {
            parse_mode: "MarkdownV2",
        });
    }
    const hasParticipant = currentChallenge.participants && Object.keys(currentChallenge.participants)?.length > 0;
    if (!hasParticipant) {
        const challengeExistText = `No existing participant for the current challenge\\.
To join the challenge, type /join`

        await ctx.reply(challengeExistText, {
            parse_mode: "MarkdownV2",
        });
    }
    const recordsToDate = await queries.getChallengeStatsToDate(chatId!)

    const participants = currentChallenge?.participants;
    const { statsByParticipantIds, fullScore } = getStats(participants, recordsToDate!)

    const statsText = `Stats to date:${Object.entries(statsByParticipantIds).map(([participantId, participantScore]) => `
\\- ${`*${participants[participantId]}*: ${participantScore}/${fullScore} ${participantScore === fullScore ? "🔥" : ""}`} `).join('')}`

    await ctx.reply(statsText, {
        parse_mode: "MarkdownV2",
    });
})

interface StatsByParticipants {
    [key: string]: number
}

const getStats = (participants: any, recordsToDate: any[]) => {
    let fullScore = 0
    const statsByParticipantIds: StatsByParticipants = {}
    Object.keys(participants).forEach(participantId => {
        statsByParticipantIds[participantId as string] = 0
    })

    recordsToDate.forEach(record => {
        fullScore++;
        if (record?.participants) {
            Object.keys(record?.participants).forEach(participantId => {
                statsByParticipantIds[participantId as string] = statsByParticipantIds[participantId as string] + 1
            })
        }
    })

    return {
        statsByParticipantIds,
        fullScore
    }
}

/* -------------------------------------------------------------------------- */
/*                                End Challenge                               */
/* -------------------------------------------------------------------------- */


bot.command("end", async (ctx) => {
    const inlineKeyboard = new InlineKeyboard()
        .text("Yes", "confirm-delete")
        .text("No", "cancel-delete")

    const endPromptText = `Are you sure you want to end the current challenge?
NOTE: All your data relating to the current challenge will be deleted upon this action.
`

    await ctx.reply(endPromptText, {
        reply_markup: inlineKeyboard,
    });
});

bot.callbackQuery("confirm-delete", async (ctx) => {
    await endChallenge(ctx)
    ctx.editMessageText("Ended previous challenge. To start a new challenge, type /initiate")
    await ctx.answerCallbackQuery({
        text: "Challenge ended!",
    });
});


bot.callbackQuery("cancel-delete", async (ctx) => {
    ctx.editMessageText("Cancelled. The current challenge resumes!")

    await ctx.answerCallbackQuery({
        text: "Cancel ending challenge",
    });
})

const endChallenge = async (ctx: Context) => {
    const ctxDetails = new CtxDetails(ctx)
    const { chatId } = ctxDetails
    await queries.deleteChallenge(chatId!)
}

/* -------------------------------------------------------------------------- */
/*                               Handle Replies                               */
/* -------------------------------------------------------------------------- */

bot.on("message", async (ctx) => {
    const replyToId = ctx.update?.message?.reply_to_message?.message_id

    if (!replyToId) {
        return
    }

    switch (replyToId) {
        case initiatePromptId: {
            const initiateChallenge = new InitiateChallenge(ctx);
            await initiateChallenge.run();
            break;
        }
        default:
            console.log(">>> Message ctx", JSON.stringify(ctx, null, 2))
    }
});

/* -------------------------------------------------------------------------- */
/*                          Catch-all Callback Query                          */
/* -------------------------------------------------------------------------- */

bot.on("callback_query:data", async (ctx) => {
    const {data} = ctx.callbackQuery

    if(isReminderCallback(data)) {
        setReminderTiming(ctx, data)
    } 

    await ctx.answerCallbackQuery(); // remove loading animation
});

bot.start();