import type { CatConfig, UserShopItem } from '@/types';

export const DEFAULT_CAT_SKIN_ID = 'cat_skin_default';

const FALLBACK_LOTTIE_BY_SKIN_ID: Record<string, string> = {
    cat_skin_nimbus: '/lottie/Cat Movement.lottie',
    cat_skin_stellar: '/lottie/Cat playing animation.lottie',
    cat_skin_aurora: '/lottie/Cat Pookie.lottie',
    cat_skin_nebula: '/lottie/Loader cat.lottie',
    cat_skin_comet: '/lottie/Black cat by PoPoF.lottie',
    cat_skin_8bit: '/lottie/8-bit Cat.lottie',
    cat_skin_loading: '/lottie/Loading Cat.lottie',
    cat_skin_rainbow: '/lottie/rainbow cat remix.lottie',
};

function normalizeLottieUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('/')) return encodeURI(url);
    return url;
}

export function getFallbackCatSkinLottieUrl(skinId: string): string | null {
    return normalizeLottieUrl(FALLBACK_LOTTIE_BY_SKIN_ID[skinId] || null);
}

export function resolveCatSkinLottieUrl(
    equippedCatSkinId?: string | null,
    purchases?: UserShopItem[],
): string | null {
    const skinId = equippedCatSkinId ?? DEFAULT_CAT_SKIN_ID;
    if (skinId === DEFAULT_CAT_SKIN_ID) return null;
    const skinItem = purchases?.find(
        (purchase) =>
            (purchase.item.type === 'CAT_SKIN' || purchase.item.type === 'CAT_ITEM') &&
            purchase.itemId === skinId &&
            typeof purchase.item.catSkinLottieUrl === 'string',
    );
    return (
        normalizeLottieUrl(skinItem?.item.catSkinLottieUrl || null) ||
        getFallbackCatSkinLottieUrl(skinId)
    );
}

const LEGACY_SKIN_LOADOUT_KEYS = [
    'cat_skin_nimbus',
    'cat_skin_stellar',
    'cat_skin_aurora',
    'cat_skin_nebula',
    'cat_skin_comet',
] as const;

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
