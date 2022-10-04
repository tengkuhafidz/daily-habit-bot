export const constructTaggedUserName = (userName: string, userId: string) => {
    return `<a href="tg://user?id=${userId}">${userName}</a>`
}