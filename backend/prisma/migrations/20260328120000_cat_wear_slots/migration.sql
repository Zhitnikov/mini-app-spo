
CREATE TYPE "CatWearSlot" AS ENUM ('HAT', 'FACE', 'NECK', 'BODY', 'BACK', 'LEGS', 'ACCESSORY');
ALTER TABLE "ShopItem" ADD COLUMN     "catWearSlot" "CatWearSlot",
ADD COLUMN     "catWearLayout" JSONB;
