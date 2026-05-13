-- CreateTable
CREATE TABLE "LessonCache" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "whyImportant" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "goodExample" TEXT NOT NULL,
    "badExample" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingCache" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadingCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LessonCache_level_idx" ON "LessonCache"("level");

-- CreateIndex
CREATE INDEX "ReadingCache_level_idx" ON "ReadingCache"("level");
