CREATE TYPE "DiscussionKind" AS ENUM ('COMMENT', 'QUESTION', 'REPLY');

CREATE TABLE "DiscussionPost" (
    "id" TEXT NOT NULL,
    "content" VARCHAR(2000) NOT NULL,
    "kind" "DiscussionKind" NOT NULL,
    "parentId" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DiscussionPost_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DiscussionPost_parentId_createdAt_idx" ON "DiscussionPost"("parentId", "createdAt");
CREATE INDEX "DiscussionPost_kind_createdAt_idx" ON "DiscussionPost"("kind", "createdAt");
CREATE INDEX "DiscussionPost_authorId_createdAt_idx" ON "DiscussionPost"("authorId", "createdAt");

ALTER TABLE "DiscussionPost" ADD CONSTRAINT "DiscussionPost_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DiscussionPost" ADD CONSTRAINT "DiscussionPost_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "DiscussionPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
