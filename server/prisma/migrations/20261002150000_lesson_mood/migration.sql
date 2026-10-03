-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Completion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" BIGINT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "passion" TEXT NOT NULL,
    "mood" TEXT,
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
INSERT INTO "new_Completion" ("activityId", "activityText", "coins", "createdAt", "duration", "exploredTitle", "extra", "id", "localDate", "mood", "passion", "photoPending", "photoRef", "projectId", "proposalId", "rating", "text", "userId") SELECT "activityId", "activityText", "coins", "createdAt", "duration", "exploredTitle", "extra", "id", "localDate", "mood", "passion", "photoPending", "photoRef", "projectId", "proposalId", "rating", "text", "userId" FROM "Completion";
DROP TABLE "Completion";
ALTER TABLE "new_Completion" RENAME TO "Completion";
CREATE UNIQUE INDEX "Completion_proposalId_key" ON "Completion"("proposalId");
CREATE INDEX "Completion_userId_createdAt_idx" ON "Completion"("userId", "createdAt");
CREATE INDEX "Completion_userId_localDate_idx" ON "Completion"("userId", "localDate");
CREATE INDEX "Completion_projectId_idx" ON "Completion"("projectId");
CREATE TABLE "new_Proposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" BIGINT NOT NULL,
    "activityId" TEXT NOT NULL,
    "passion" TEXT NOT NULL,
    "mood" TEXT,
    "duration" INTEGER NOT NULL,
    "intro" TEXT NOT NULL,
    "extra" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Proposal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Proposal" ("activityId", "createdAt", "duration", "extra", "id", "intro", "mood", "passion", "status", "userId") SELECT "activityId", "createdAt", "duration", "extra", "id", "intro", "mood", "passion", "status", "userId" FROM "Proposal";
DROP TABLE "Proposal";
ALTER TABLE "new_Proposal" RENAME TO "Proposal";
CREATE INDEX "Proposal_userId_createdAt_idx" ON "Proposal"("userId", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

