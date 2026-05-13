-- CreateTable
CREATE TABLE "ListeningCache" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "passage" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "audioUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListeningCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ListeningCache_level_topic_idx" ON "ListeningCache"("level", "topic");
