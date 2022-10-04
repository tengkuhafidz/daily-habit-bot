import moment from "https://deno.land/x/momentjs@2.29.1-deno/mod.ts";
import { time } from "https://deno.land/x/time.ts@v2.0.1/mod.ts";

export const tzMoment = (timezone = "asia/singapore", dateTime?: string) => {
    return moment(time(dateTime).tz(timezone).t)
}