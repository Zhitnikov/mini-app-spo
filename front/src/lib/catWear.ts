import type { CSSProperties } from 'react';
import { ALL_BUILTIN_WEAR_IDS } from '@/components/cat/builtinCatWear';
import type { ShopItem } from '@/types';

export type CatWearSlot =
    | 'HAT'
    | 'FACE'
    | 'NECK'
    | 'BODY'
    | 'BACK'
    | 'LEGS'
    | 'ACCESSORY'
    | 'EAR'
    | 'FEET'
    | 'TAIL'
    | 'WRIST';

export interface CatWearLayout {
    anchorX: number;
    anchorY: number;
    widthPercent: number;
    zIndex: number;
    rotationDeg?: number;
}

export const CAT_WEAR_SLOTS: { id: CatWearSlot; label: string }[] = [
    { id: 'EAR', label: 'Уши' },
    { id: 'HAT', label: 'Голова (шляпы, короны)' },
    { id: 'FACE', label: 'Лицо (очки, маски)' },
    { id: 'NECK', label: 'Шея (шарф, бабочка)' },
    { id: 'BODY', label: 'Тело (куртка, худи)' },
    { id: 'BACK', label: 'За спиной (рюкзак)' },
    { id: 'LEGS', label: 'Ноги (шорты, гетры)' },
    { id: 'FEET', label: 'Лапы / обувь' },
    { id: 'TAIL', label: 'Хвост' },
    { id: 'WRIST', label: 'Запястье / лапа' },
    { id: 'ACCESSORY', label: 'Другое' },
];

/** z-index: ниже = дальше «сзади» */
export const DEFAULT_SLOT_LAYOUTS: Record<CatWearSlot, CatWearLayout> = {
    BACK: { anchorX: 0.38, anchorY: 0.49, widthPercent: 0.48, zIndex: 6 },
    TAIL: { anchorX: 0.22, anchorY: 0.71, widthPercent: 0.42, zIndex: 10 },
    LEGS: { anchorX: 0.5, anchorY: 0.69, widthPercent: 0.56, zIndex: 14 },
    FEET: { anchorX: 0.5, anchorY: 0.845, widthPercent: 0.53, zIndex: 20 },
    BODY: { anchorX: 0.5, anchorY: 0.55, widthPercent: 0.64, zIndex: 24 },
    ACCESSORY: { anchorX: 0.5, anchorY: 0.57, widthPercent: 0.38, zIndex: 26 },
    WRIST: { anchorX: 0.34, anchorY: 0.79, widthPercent: 0.24, zIndex: 30 },
    NECK: { anchorX: 0.5, anchorY: 0.405, widthPercent: 0.55, zIndex: 34 },
    EAR: { anchorX: 0.5, anchorY: 0.195, widthPercent: 0.6, zIndex: 38 },
    FACE: { anchorX: 0.5, anchorY: 0.295, widthPercent: 0.45, zIndex: 42 },
    HAT: { anchorX: 0.5, anchorY: 0.115, widthPercent: 0.54, zIndex: 48 },
};

export function usesBuiltinVectorWear(item: ShopItem): boolean {
    if (item.imageUrl) return false;
    const ic = item.icon?.trim() ?? '';
    if (ic.startsWith('/') || ic.startsWith('http')) return false;
    return ALL_BUILTIN_WEAR_IDS.includes(item.id);
}

export function layoutForWearRender(item: ShopItem): CatWearLayout {
    if (usesBuiltinVectorWear(item)) {
        const slot = item.catWearSlot ?? inferSlotFromKeywords(item);
        return {
            anchorX: 0.5,
            anchorY: 0.5,
            widthPercent: 1,
            zIndex: DEFAULT_SLOT_LAYOUTS[slot].zIndex,
            rotationDeg: 0,
        };
    }
    return resolveWearLayout(item);
}

export function getWearSlot(item: ShopItem): CatWearSlot {
    return item.catWearSlot ?? inferSlotFromKeywords(item);
}

function inferSlotFromKeywords(item: ShopItem): CatWearSlot {
    const s = `${item.id} ${item.name} ${item.description}`.toLowerCase();
    if (/ушк|ear|бант на ух|уши\b/.test(s)) return 'EAR';
    if (/hat|crown|cap|шапк|шляп|корон|кепк|берет|ободок|корона/.test(s))
        return 'HAT';
    if (/glass|eye|очк|монокль|маск|lens/.test(s)) return 'FACE';
    if (/scarf|tie|bow|collar|шарф|галст|бабочк|ошейник|жемчуг|necklace/.test(s))
        return 'NECK';
    if (/hoodie|hood|куртк|жилет|костюм|худи|пиджак|jacket/.test(s))
        return 'BODY';
    if (/backpack|рюкзак|за спиной|cape|плащ/.test(s)) return 'BACK';
    if (/short|штаны|шорт|гетр|лег|sock|носк/.test(s)) return 'LEGS';
    if (/boot|ботин|кроссов|sneaker|туфл|лап|обув/.test(s)) return 'FEET';
    if (/хвост|tail/.test(s)) return 'TAIL';
    if (/час|watch|браслет|wrist/.test(s)) return 'WRIST';
    if (/vest|жилет(?!\s*с)/.test(s)) return 'BODY';
    return 'ACCESSORY';
}

function parseLayoutJson(raw: unknown): Partial<CatWearLayout> | null {
    if (!raw || typeof raw !== 'object') return null;
    const o = raw as Record<string, unknown>;
    const anchorX = Number(o.anchorX);
    const anchorY = Number(o.anchorY);
    const widthPercent = Number(o.widthPercent);
    const zIndex = Number(o.zIndex);
    if (
        [anchorX, anchorY, widthPercent, zIndex].some(
            (n) => Number.isNaN(n),
        )
    )
        return null;
    const rotationDeg =
        o.rotationDeg !== undefined ? Number(o.rotationDeg) : undefined;
    return {
        anchorX,
        anchorY,
        widthPercent,
        zIndex,
        rotationDeg:
            rotationDeg !== undefined && !Number.isNaN(rotationDeg)
                ? rotationDeg
                : undefined,
    };
}

export function mergeWearLayout(
    slot: CatWearSlot,
    stored: unknown,
): CatWearLayout {
    const base = DEFAULT_SLOT_LAYOUTS[slot];
    const parsed = parseLayoutJson(stored);
    if (!parsed) return { ...base };
    return {
        anchorX: parsed.anchorX ?? base.anchorX,
        anchorY: parsed.anchorY ?? base.anchorY,
        widthPercent: parsed.widthPercent ?? base.widthPercent,
        zIndex: parsed.zIndex ?? base.zIndex,
        rotationDeg: parsed.rotationDeg ?? base.rotationDeg,
    };
}

export function resolveWearLayout(item: ShopItem): CatWearLayout {
    const slot = item.catWearSlot ?? inferSlotFromKeywords(item);
    return mergeWearLayout(slot, item.catWearLayout);
}

export function wearLayoutStyle(layout: CatWearLayout): CSSProperties {
    const rot = layout.rotationDeg ?? 0;
    return {
        position: 'absolute',
        left: `${layout.anchorX * 100}%`,
        top: `${layout.anchorY * 100}%`,
        width: `${layout.widthPercent * 100}%`,
        zIndex: layout.zIndex,
        transform: `translate(-50%, -50%) rotate(${rot}deg)`,
        transformOrigin: 'center center',
        pointerEvents: 'none',
    };
}
