import { Context } from "https://deno.land/x/grammy@v1.9.0/context.ts";
import { constructTaggedUserName } from "./constructTaggedUserName.ts";

export class CtxDetails {
    constructor(public ctx: Context) { }

    public get chatId() {
        return this.ctx.update.message?.chat.id?.toString() ?? this.ctx.update.callback_query?.message?.chat.id?.toString()
    }

    public get messageText() {
        return this.ctx.message?.text
    }

    public get userId() {
        return this.ctx.update.message?.from?.id.toString()
    }

    public get userName() {
        const firstName = this.ctx.update.message?.from?.first_name ?? ""
        const lastName = this.ctx.update.message?.from?.last_name ?? ""
        return `${firstName}${firstName ? " " : ""}${lastName}`
    }

    public get taggedUserName() {
        return constructTaggedUserName(this.userName, this.userId!)
    }
}