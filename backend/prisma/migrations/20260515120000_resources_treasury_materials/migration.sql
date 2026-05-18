-- CreateTable
CREATE TABLE "SquadTreasuryCache" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "headers" JSONB NOT NULL,
    "rows" JSONB NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SquadTreasuryCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialRoleAccess" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,

    CONSTRAINT "MaterialRoleAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialUserAccess" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "MaterialUserAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MaterialRoleAccess_materialId_role_key" ON "MaterialRoleAccess"("materialId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialUserAccess_materialId_userId_key" ON "MaterialUserAccess"("materialId", "userId");

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRoleAccess" ADD CONSTRAINT "MaterialRoleAccess_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialUserAccess" ADD CONSTRAINT "MaterialUserAccess_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialUserAccess" ADD CONSTRAINT "MaterialUserAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
