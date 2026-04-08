import CatBodyAnimated from '@/components/cat/CatBodyAnimated';
import { BuiltinTailRibbonG } from '@/components/cat/builtinTailWear';
import { getBuiltinWearComponent } from '@/components/cat/builtinCatWear';
import type { ShopItem } from '@/types';
import {
    wearLayoutStyle,
    mergeWearLayout,
    layoutForWearRender,
    usesBuiltinVectorWear,
    type CatWearLayout,
    type CatWearSlot,
} from '@/lib/catWear';

interface CatWearPreviewProps {
    imageUrl?: string | null;
    icon?: string | null;
    layout: CatWearLayout;
    slot: CatWearSlot;
    previewItemId?: string | null;
    /** Устарело: превью всегда на SVG-коте */
    skinLottieSrc?: string | null;
    className?: string;
}

/**
 * Превью примерочной: тот же пропорции, что у CatOleg (200×280).
 */
export default function CatWearPreview({
    imageUrl,
    icon,
    layout,
    slot,
    previewItemId,
    skinLottieSrc: _skinLottieSrc = null,
    className = '',
}: CatWearPreviewProps) {
    void _skinLottieSrc;
    const synthetic: ShopItem = {
        id: previewItemId ?? '__new_cat_item__',
        type: 'CAT_ITEM',
        name: '',
        description: '',
        price: 0,
        icon: icon ?? null,
        imageUrl: imageUrl ?? null,
        catWearSlot: slot,
        catWearLayout: layout,
        requiresFighter: false,
        createdAt: '',
    };

    const Builtin =
        previewItemId && getBuiltinWearComponent(previewItemId);
    const vectorOk = Boolean(Builtin && usesBuiltinVectorWear(synthetic));
    const tailRibbonPreview =
        previewItemId === 'cat_tail_ribbon' &&
        usesBuiltinVectorWear(synthetic) &&
        !imageUrl;

    const renderLayout = vectorOk
        ? layoutForWearRender(synthetic)
        : mergeWearLayout(slot, layout);
    const style = wearLayoutStyle(renderLayout);

    const url =
        imageUrl ||
        (icon?.startsWith('/') || icon?.startsWith('http') ? icon : null);

    return (
        <div
            className={`relative w-44 min-w-44 aspect-[200/280] mx-auto rounded-[2rem] bg-gradient-to-b from-slate-50 to-slate-200/90 border border-slate-200/80 shadow-[inset_0_2px_12px_rgba(255,255,255,0.85)] overflow-hidden ring-1 ring-white/60 ${className}`}
        >
            <div className="absolute inset-[5%] z-0">
                <CatBodyAnimated
                    mood="idle"
                    tailWear={
                        tailRibbonPreview ? (
                            <BuiltinTailRibbonG />
                        ) : undefined
                    }
                />
            </div>

            {tailRibbonPreview ? null : vectorOk && Builtin ? (
                <div style={style} className="transition-all duration-150">
                    <Builtin mood="idle" />
                </div>
            ) : url ? (
                <div style={style} className="transition-all duration-150">
                    <img
                        src={url}
                        alt=""
                        className="w-full h-full object-contain drop-shadow-md"
                    />
                </div>
            ) : icon ? (
                <div style={style} className="transition-all duration-150">
                    <span className="flex items-center justify-center w-full h-full text-5xl leading-none">
                        {icon}
                    </span>
                </div>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center z-10 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center px-4">
                    Загрузите PNG или эмодзи
                </div>
            )}
        </div>
    );
}
