import { webhookCallback } from "https://deno.land/x/grammy@v1.9.2/mod.ts";
import { serve } from "https://deno.land/x/sift@0.5.0/mod.ts";
// You might modify this to the correct way to import your `Bot` object.
import { bot } from "./bot.ts";
import { appConfig } from "./configs/appConfig.ts";
import { queries } from "./repositories/queries.ts";
import { constructTaggedUserName } from "./utils/constructTaggedUserName.ts";
import { tzMoment } from "./utils/tzMoment.ts";

const handleUpdate = webhookCallback(bot, "std/http");

serve({
  ["/" + appConfig.botApiKey]: async (req) => {
    if (req.method == "POST") {
      try {
        return await handleUpdate(req);
      } catch (err) {
        console.error(err);
      }
    }
    return new Response();
  },
  ["/remind"]: async (req) => {
    try {
      const currHour = `${tzMoment().hour()}00`
      console.log(">>>> currHour", currHour)
      const toBeReminded = await queries.getChallengesToBeReminded(currHour)
      console.log(">>>> toBeReminded", JSON.stringify(toBeReminded, null, 2))

      if (!toBeReminded) {
        return new Response();
      }

      toBeReminded.forEach(async challenge => {
        const hasParticipant = challenge.participants && Object.keys(challenge.participants)?.length > 0;

        if (!hasParticipant) {
          const challengeExistText = `No existing participant for the current challenge\\.

To join the challenge, type /join`

          const apiUrl = `https://api.telegram.org/bot${appConfig.botApiKey}/sendMessage?chat_id=${challenge.chatId}&text=${encodeURI(challengeExistText)}&parse_mode=MarkdownV2`
          await fetch(apiUrl)
        } else {
          const todayRecord = await queries.getToday(challenge.chatId)
          const usersDone = todayRecord?.participants;

          if (!todayRecord) {
            await queries.createToday(challenge.chatId)
          }

          const todayText = `Here's the current progress for today:${Object.entries(challenge.participants).map(([participantId, participantName]) => `
\\- ${constructTaggedUserName(participantName as string, participantId)} ${usersDone?.[participantId] ? "✅" : "🔘"}`).join('')}
    
*NOTE:* Once you've done the challenge for the day, simply type /done`
          const apiUrl = `https://api.telegram.org/bot${appConfig.botApiKey}/sendMessage?chat_id=${challenge.chatId}&text=${encodeURI(todayText)}&parse_mode=MarkdownV2`
          await fetch(apiUrl)
        }

      })
      return new Response("success");
    } catch (err) {
      console.error(err);
    }
    return new Response(req);
  },
  "/": () => {
    return new Response("Hello world!");
  },
});
