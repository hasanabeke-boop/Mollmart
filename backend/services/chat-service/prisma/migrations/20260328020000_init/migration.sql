CREATE TYPE "ConversationStatus" AS ENUM (
  'active',
  'closed'
);

CREATE TYPE "MessageType" AS ENUM (
  'text',
  'system'
);

CREATE TYPE "SenderRole" AS ENUM (
  'buyer',
  'seller',
  'admin'
);

CREATE TABLE "Conversation" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "offerId" TEXT,
  "buyerId" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "status" "ConversationStatus" NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastMessageAt" TIMESTAMP(3),
  CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Message" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "senderRole" "SenderRole" NOT NULL,
  "body" TEXT NOT NULL,
  "messageType" "MessageType" NOT NULL DEFAULT 'text',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MessageReadState" (
  "id" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MessageReadState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Conversation_requestId_buyerId_sellerId_key" ON "Conversation"("requestId", "buyerId", "sellerId");
CREATE INDEX "Conversation_buyerId_lastMessageAt_idx" ON "Conversation"("buyerId", "lastMessageAt" DESC);
CREATE INDEX "Conversation_sellerId_lastMessageAt_idx" ON "Conversation"("sellerId", "lastMessageAt" DESC);
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt" DESC);
CREATE UNIQUE INDEX "MessageReadState_messageId_userId_key" ON "MessageReadState"("messageId", "userId");
CREATE INDEX "MessageReadState_userId_readAt_idx" ON "MessageReadState"("userId", "readAt" DESC);

ALTER TABLE "Message"
  ADD CONSTRAINT "Message_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MessageReadState"
  ADD CONSTRAINT "MessageReadState_messageId_fkey"
  FOREIGN KEY ("messageId") REFERENCES "Message"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
