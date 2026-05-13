-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'ru',
    "level" TEXT NOT NULL DEFAULT 'B1-B2',
    "currentBand" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "targetBand" DOUBLE PRECISION NOT NULL DEFAULT 6.5,
    "examIn" TEXT NOT NULL DEFAULT 'flexible',
    "studyMinutes" INTEGER NOT NULL DEFAULT 30,
    "weakAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lessonsCompleted" INTEGER NOT NULL DEFAULT 0,
    "writingSubmissions" INTEGER NOT NULL DEFAULT 0,
    "mockExamsCompleted" INTEGER NOT NULL DEFAULT 0,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Essay" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskType" TEXT NOT NULL DEFAULT 'task2',
    "prompt" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "taScore" DOUBLE PRECISION NOT NULL,
    "ccScore" DOUBLE PRECISION NOT NULL,
    "lrScore" DOUBLE PRECISION NOT NULL,
    "graScore" DOUBLE PRECISION NOT NULL,
    "overallBand" DOUBLE PRECISION NOT NULL,
    "feedback" TEXT NOT NULL,
    "topTip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Essay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "lessonTopic" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "score" DOUBLE PRECISION,
    "examType" TEXT NOT NULL DEFAULT 'ielts',
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- AddForeignKey
ALTER TABLE "Essay" ADD CONSTRAINT "Essay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
