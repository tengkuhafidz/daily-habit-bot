import { Context } from "https://deno.land/x/grammy@v1.9.0/context.ts";
import { queries } from "../repositories/queries.ts";
import { CtxDetails } from "../utils/CtxDetails.ts";

export class InitiateChallenge {
    private newChallengeName?: string
    private chatId?: string

    constructor(private ctx: Context) {
        const ctxDetails = new CtxDetails(ctx)
        const { messageText, chatId } = ctxDetails
        this.newChallengeName = messageText
        this.chatId = chatId
    }

    public async run() {
        if (!this.newChallengeName || !this.chatId) {
            return
        }

        await this.startNewChallenge()
    }

    private async rejectNewChallenge(existingChallengeName: string) {
        const challengeExistText = `This group already have an existing challenge running: <b>${existingChallengeName}</b>.
To start a new challenge, end the current one with /end`

        await this.ctx.reply(challengeExistText, {
            parse_mode: "HTML",
        });
    }

    private async startNewChallenge() {
        await queries.saveChallenge(this.chatId!, this.newChallengeName!)

        const replyText = `Daily challenge started: <b>${this.newChallengeName!}</b>
To join the challenge, type /join`

        await this.ctx.reply(replyText, {
            parse_mode: "HTML",
        });
    }
}