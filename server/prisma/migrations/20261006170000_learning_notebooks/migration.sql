CREATE TABLE "LearningEntry" (
 "id" TEXT NOT NULL PRIMARY KEY, "userId" BIGINT NOT NULL, "lessonId" TEXT NOT NULL,
 "passion" TEXT NOT NULL, "title" TEXT NOT NULL, "work" TEXT NOT NULL,
 "completed" BOOLEAN NOT NULL DEFAULT false, "mastered" BOOLEAN NOT NULL DEFAULT false,
 "review" BOOLEAN NOT NULL DEFAULT false, "updatedAt" DATETIME NOT NULL,
 "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "LearningEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "LearningEntry_userId_updatedAt_idx" ON "LearningEntry"("userId", "updatedAt");
