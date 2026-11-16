CREATE TYPE "SupportStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'REPLIED', 'CLOSED');

CREATE TABLE "SupportRequest" (
    "id" TEXT NOT NULL,
    "requestNumber" SERIAL NOT NULL,
    "telegramUpdateId" INTEGER NOT NULL,
    "telegramChatId" TEXT NOT NULL,
    "telegramUserId" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "messageText" TEXT,
    "telegramMessageId" INTEGER NOT NULL,
    "groupNotificationId" INTEGER,
    "groupMediaMessageId" INTEGER,
    "attachment" JSONB,
    "status" "SupportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    CONSTRAINT "SupportRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportReply" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "adminTelegramUserId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportReply_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SupportRequest_requestNumber_key" ON "SupportRequest"("requestNumber");
CREATE UNIQUE INDEX "SupportRequest_telegramUpdateId_key" ON "SupportRequest"("telegramUpdateId");
CREATE INDEX "SupportRequest_status_createdAt_idx" ON "SupportRequest"("status", "createdAt");
CREATE INDEX "SupportRequest_telegramUserId_createdAt_idx" ON "SupportRequest"("telegramUserId", "createdAt");
CREATE INDEX "SupportReply_requestId_createdAt_idx" ON "SupportReply"("requestId", "createdAt");

ALTER TABLE "SupportReply" ADD CONSTRAINT "SupportReply_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "SupportRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
