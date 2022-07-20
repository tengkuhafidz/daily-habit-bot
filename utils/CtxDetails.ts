import { Context } from "https://deno.land/x/grammy@v1.9.0/context.ts";

export class CtxDetails {

    constructor(public ctx: Context) {}

    public get chatId() {
        return this.ctx.update.message?.chat.id?.toString() ?? this.ctx.update.callback_query?.message?.chat.id?.toString()
    }

    public get messageText() {
        return this.ctx.message?.text
    }

    public get userId() {
        return this.ctx.update.message?.from?.id
    }

    public get userName() {
        const username = this.ctx.update.message?.from?.username
        if(username) {
            return `@${username}`
        }

        const firstName = this.ctx.update.message?.from?.first_name
        const lastName = this.ctx.update.message?.from?.last_name
        return `${firstName}${firstName ? " " : "" }${lastName}`
    }
}