CREATE TABLE "SiteVisit" (
    "id" TEXT NOT NULL,
    "path" VARCHAR(200) NOT NULL,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteVisit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SiteVisit_visitedAt_idx" ON "SiteVisit"("visitedAt");
