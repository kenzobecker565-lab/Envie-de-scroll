-- CreateTable
CREATE TABLE "User" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL DEFAULT '',
    "username" TEXT,
    "languageCode" TEXT,
    "passions" TEXT NOT NULL DEFAULT '[]',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Paris',
    "canMessage" BOOLEAN NOT NULL DEFAULT false,
    "remindersEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reminderCount" INTEGER NOT NULL DEFAULT 0,
    "unansweredReminders" INTEGER NOT NULL DEFAULT 0,
    "lastReminderDate" TEXT,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" BIGINT NOT NULL,
    "activityId" TEXT NOT NULL,
    "passion" TEXT NOT NULL,
    "mood" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "intro" TEXT NOT NULL,
    "extra" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Proposal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Completion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" BIGINT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "passion" TEXT NOT NULL,
    "mood" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "activityText" TEXT NOT NULL,
    "extra" TEXT,
    "coins" INTEGER NOT NULL,
    "text" TEXT,
    "exploredTitle" TEXT,
    "photoRef" TEXT,
    "photoPending" BOOLEAN NOT NULL DEFAULT false,
    "localDate" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Completion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Completion_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Proposal_userId_createdAt_idx" ON "Proposal"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Completion_proposalId_key" ON "Completion"("proposalId");

-- CreateIndex
CREATE INDEX "Completion_userId_createdAt_idx" ON "Completion"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Completion_userId_localDate_idx" ON "Completion"("userId", "localDate");
