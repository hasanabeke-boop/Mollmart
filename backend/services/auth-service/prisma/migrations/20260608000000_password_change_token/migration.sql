CREATE TABLE "PasswordChangeToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordChangeToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PasswordChangeToken_token_key" ON "PasswordChangeToken"("token");

ALTER TABLE "PasswordChangeToken" ADD CONSTRAINT "PasswordChangeToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
