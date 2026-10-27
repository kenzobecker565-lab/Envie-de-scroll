-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" BIGINT NOT NULL,
    "passion" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goal" INTEGER,
    "finishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Completion" (
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
    "rating" INTEGER,
    "localDate" TEXT NOT NULL,
    "projectId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Completion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Completion_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Completion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Completion" ("activityId", "activityText", "coins", "createdAt", "duration", "exploredTitle", "extra", "id", "localDate", "mood", "passion", "photoPending", "photoRef", "proposalId", "rating", "text", "userId") SELECT "activityId", "activityText", "coins", "createdAt", "duration", "exploredTitle", "extra", "id", "localDate", "mood", "passion", "photoPending", "photoRef", "proposalId", "rating", "text", "userId" FROM "Completion";
DROP TABLE "Completion";
ALTER TABLE "new_Completion" RENAME TO "Completion";
CREATE UNIQUE INDEX "Completion_proposalId_key" ON "Completion"("proposalId");
CREATE INDEX "Completion_userId_createdAt_idx" ON "Completion"("userId", "createdAt");
CREATE INDEX "Completion_userId_localDate_idx" ON "Completion"("userId", "localDate");
CREATE INDEX "Completion_projectId_idx" ON "Completion"("projectId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Project_userId_createdAt_idx" ON "Project"("userId", "createdAt");
