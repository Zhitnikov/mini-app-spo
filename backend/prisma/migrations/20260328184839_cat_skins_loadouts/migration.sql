-- AlterEnum
ALTER TYPE "ShopItemType" ADD VALUE 'CAT_SKIN';

-- AlterTable
ALTER TABLE "CatConfig" ADD COLUMN     "equippedCatSkinId" TEXT NOT NULL DEFAULT 'cat_skin_default',
ADD COLUMN     "skinLoadouts" JSONB;

-- AlterTable
ALTER TABLE "ShopItem" ADD COLUMN     "catSkinLottieUrl" TEXT;
