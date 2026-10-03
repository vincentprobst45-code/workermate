-- CreateTable
CREATE TABLE "RefreshTokenSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "replacedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshTokenSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RefreshTokenSession_tokenHash_key" ON "RefreshTokenSession"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshTokenSession_jti_key" ON "RefreshTokenSession"("jti");

-- CreateIndex
CREATE INDEX "RefreshTokenSession_userId_revokedAt_idx" ON "RefreshTokenSession"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "RefreshTokenSession_familyId_revokedAt_idx" ON "RefreshTokenSession"("familyId", "revokedAt");

-- CreateIndex
CREATE INDEX "RefreshTokenSession_expiresAt_idx" ON "RefreshTokenSession"("expiresAt");

-- AddForeignKey
ALTER TABLE "RefreshTokenSession" ADD CONSTRAINT "RefreshTokenSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;