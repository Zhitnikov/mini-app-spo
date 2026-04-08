export type UserRole = 'CANDIDATE' | 'FIGHTER' | 'COMMANDER' | 'COMMANDANT' | 'EXTERNAL_COMMISSAR' | 'INTERNAL_COMMISSAR' | 'METHODIST' | 'PRESS_CENTER_HEAD' | 'COMSOSTAV';
export type ShopItemType = 'BACKGROUND' | 'BADGE' | 'CAT_ITEM' | 'CAT_SKIN' | 'ACHIEVEMENT';

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
export type EventStatus = 'PENDING' | 'APPROVED' | 'NEEDS_REVISION' | 'REJECTED';

export interface UserProfile {
    id: string;
    vkId: number;
    fullName: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    coins: number;
    avatarUrl: string | null;
    orbitAchievementIds?: string[];
    backgroundId: string | null;
    background?: ShopItem | null;
    equippedBadges?: UserBadge[];
    catConfig?: CatConfig | null;
    achievements?: UserAchievement[];
    purchases?: UserShopItem[];
    attendances?: EventAttendeeWithEvent[];
    organizedEvents?: EventSummary[];
    _count?: { attendances: number; organizedEvents: number };
    createdAt: string;
}

export interface Event {
    id: string;
    title: string;
    subtitle: string;
    shortDescription: string;
    description: string;
    date: string;
    dateLabel: string;
    location: string;
    latitude: number | null;
    longitude: number | null;
    imageUrl: string | null;
    pollQuestion: string;
    status: EventStatus;
    moderationComment?: string;
    coinsReward: number;
    organizerId: string;
    organizer: { id: string; fullName: string; avatarUrl: string | null };
    attendances?: EventAttendee[];
    checkers?: Array<{ id: string; userId: string; user?: { id: string; fullName: string } }>;
    _count?: { attendances: number };
    createdAt: string;
}

export interface EventSummary {
    id: string;
    title: string;
    dateLabel: string;
    imageUrl: string | null;
    status?: EventStatus;
}

export interface EventAttendee {
    id: string;
    userId: string;
    eventId: string;
    registeredAt: string;
    confirmedAt: string | null;
    coinsAwarded: boolean;
    contactEmail?: string | null;
    emailConsent?: boolean;
    reminderSentAt?: string | null;
    user?: { id: string; fullName: string; avatarUrl: string | null };
}

export interface EventAttendeeWithEvent extends EventAttendee {
    event: EventSummary;
}

export interface ShopItem {
    id: string;
    type: ShopItemType;
    name: string;
    description: string;
    price: number;
    icon: string | null;
    imageUrl: string | null;
    requiresFighter: boolean;
    catWearSlot?: CatWearSlot | null;
    catWearLayout?: CatWearLayout | Record<string, unknown> | null;
    catSkinLottieUrl?: string | null;
    createdAt: string;
}

export interface UserShopItem {
    id: string;
    userId: string;
    itemId: string;
    purchasedAt: string;
    item: ShopItem;
}

export interface UserBadge {
    id: string;
    userId: string;
    itemId: string;
    position: number;
    item: ShopItem;
}

export interface CatConfig {
    id: string;
    userId: string;
    equippedItems: string[];
    equippedCatSkinId: string;
    skinLoadouts?: Record<string, string[]> | null;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    condition: string;
}

export interface UserAchievement {
    id: string;
    userId: string;
    achievementId: string;
    earnedAt: string;
    achievement: Achievement;
}

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
    CANDIDATE: 'Кандидат',
    FIGHTER: 'Боец',
    COMMANDER: 'Командир',
    COMMANDANT: 'Комендант',
    EXTERNAL_COMMISSAR: 'Внешний комиссар',
    INTERNAL_COMMISSAR: 'Внутренний комиссар',
    METHODIST: 'Методист',
    PRESS_CENTER_HEAD: 'Рук. пресс-центра',
    COMSOSTAV: 'Комсостав',
};

export const FIGHTER_ROLES: UserRole[] = [
    'FIGHTER',
    'COMMANDER',
    'COMMANDANT',
    'EXTERNAL_COMMISSAR',
    'INTERNAL_COMMISSAR',
    'METHODIST',
    'PRESS_CENTER_HEAD',
    'COMSOSTAV',
];
