-- CreateTable
CREATE TABLE "AgentFeedback" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "messageIndex" INTEGER NOT NULL,
    "rating" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AgentFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgentFeedback_conversationId_messageIndex_userId_key" ON "AgentFeedback"("conversationId", "messageIndex", "userId");

-- CreateIndex
CREATE INDEX "AgentFeedback_userId_idx" ON "AgentFeedback"("userId");

-- CreateIndex
CREATE INDEX "AgentFeedback_conversationId_idx" ON "AgentFeedback"("conversationId");

-- AddForeignKey
ALTER TABLE "AgentFeedback" ADD CONSTRAINT "AgentFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
