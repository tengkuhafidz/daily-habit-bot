export const constructTaggedUserName = (userName: string, userId: string) => {
    return `[${userName}](tg://user?id=${userId})`
}