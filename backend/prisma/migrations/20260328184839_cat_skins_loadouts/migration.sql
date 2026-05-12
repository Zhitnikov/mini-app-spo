
ALTER TYPE "ShopItemType" ADD VALUE 'CAT_SKIN';

ALTER TABLE "CatConfig" ADD COLUMN     "equippedCatSkinId" TEXT NOT NULL DEFAULT 'cat_skin_default',
ADD COLUMN     "skinLoadouts" JSONB;

ALTER TABLE "ShopItem" ADD COLUMN     "catSkinLottieUrl" TEXT;
