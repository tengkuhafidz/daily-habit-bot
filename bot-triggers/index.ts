import { done } from "./done.ts";
import { end, cancelDelete, confirmDelete } from "./end.ts";
import { initiate, initiateChallengeIfValid } from "./initiate.ts";
import { join } from "./join.ts";
import { lastMonth } from "./last-month.ts";
import { past7Days } from "./past-7-days.ts";
import { noReminder, setReminder, setReminderTimingIfValid } from "./set-reminder.ts";
import { start } from "./start.ts";
import { stats } from "./stats.ts";
import { today } from "./today.ts";

export const CommandTriggers = {
    done,
    end,
    initiate,
    join,
    lastMonth,
    past7Days,
    setReminder,
    start,
    stats,
    today,
};

export const CallbackTriggers = {
    cancelDelete,
    confirmDelete,
    noReminder,
    setReminderTimingIfValid
}

export const ReplyTriggers = {
    initiateChallengeIfValid
}
