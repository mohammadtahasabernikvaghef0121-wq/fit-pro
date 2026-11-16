/** Telegram bot access is bound to numeric identity and a configured private chat. */
export function isAuthorizedTelegramOwner(senderId: number | undefined, chatId: number | undefined, ownerUserId: number, adminChatId: number) {
  return Number.isSafeInteger(senderId) && Number.isSafeInteger(chatId)
    && ownerUserId > 0 && adminChatId > 0
    && senderId === ownerUserId && chatId === adminChatId && chatId === ownerUserId;
}
