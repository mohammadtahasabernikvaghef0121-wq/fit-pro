CREATE TYPE "SupportChannel" AS ENUM ('TELEGRAM', 'WEBSITE');

ALTER TABLE "SupportRequest"
    ALTER COLUMN "telegramUpdateId" DROP NOT NULL,
    ALTER COLUMN "telegramChatId" DROP NOT NULL,
    ALTER COLUMN "telegramUserId" DROP NOT NULL,
    ALTER COLUMN "telegramMessageId" DROP NOT NULL;

ALTER TABLE "SupportReply" ALTER COLUMN "adminTelegramUserId" DROP NOT NULL;

ALTER TABLE "SupportRequest"
    ADD COLUMN "phone" TEXT,
    ADD COLUMN "userId" TEXT,
    ADD COLUMN "source" "SupportChannel" NOT NULL DEFAULT 'TELEGRAM',
    ADD COLUMN "intake" JSONB;

ALTER TABLE "SupportReply" ADD COLUMN "isAdmin" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "SupportRequest_userId_createdAt_idx" ON "SupportRequest"("userId", "createdAt");
ALTER TABLE "SupportRequest" ADD CONSTRAINT "SupportRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
