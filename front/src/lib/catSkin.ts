import type { CatConfig, UserShopItem } from '@/types';

/** Базовый облик: не ShopItem; тело всегда анимированный SVG (`CatBodyAnimated`), одежда — CAT_ITEM. */
export const DEFAULT_CAT_SKIN_ID = 'cat_skin_default';

/**
 * Полное тело из Lottie больше не используется: чужие Lottie ломали пропорции и не надевается одежда.
 * Всегда `null` → в `CatOleg` рисуется один и тот же кот с гардеробом.
 */
export function resolveCatSkinLottieUrl(
    _equippedCatSkinId?: string | null,
    _purchases?: UserShopItem[],
): string | null {
    void _equippedCatSkinId;
    void _purchases;
    return null;
}

const LEGACY_SKIN_LOADOUT_KEYS = [
    'cat_skin_nimbus',
    'cat_skin_stellar',
    'cat_skin_aurora',
    'cat_skin_nebula',
    'cat_skin_comet',
] as const;

/** Активный комплект одежды (после отказа от Lottie-скинов — в основном ключ `cat_skin_default`). */
export function equippedWearForActiveSkin(
    config: CatConfig | null | undefined,
): string[] {
    if (!config) return [];
    const skinId = config.equippedCatSkinId ?? DEFAULT_CAT_SKIN_ID;
    const raw = config.skinLoadouts;
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        const map = raw as Record<string, unknown>;
        const arr = map[skinId];
        if (Array.isArray(arr) && arr.every((x) => typeof x === 'string')) {
            return arr;
        }
        if (skinId === DEFAULT_CAT_SKIN_ID) {
            for (const k of LEGACY_SKIN_LOADOUT_KEYS) {
                const v = map[k];
                if (
                    Array.isArray(v) &&
                    v.every((x) => typeof x === 'string') &&
                    v.length > 0
                ) {
                    return v;
                }
            }
        }
    }
    return config.equippedItems ?? [];
}
