export const MANAGEMENT_LEADER_ROLES = [
    'COMSOSTAV',
    'COMMANDER',
    'COMMANDANT',
    'EXTERNAL_COMMISSAR',
    'INTERNAL_COMMISSAR',
    'METHODIST',
    'PRESS_CENTER_HEAD',
] as const;

export function isManagementLeaderRole(role: string | undefined | null): boolean {
    return !!role && (MANAGEMENT_LEADER_ROLES as readonly string[]).includes(role);
}

export const FIGHTER_ELIGIBLE_ROLES = [
    'FIGHTER',
    ...MANAGEMENT_LEADER_ROLES,
] as const;

export function isFighterEligibleRole(role: string | undefined | null): boolean {
    return !!role && (FIGHTER_ELIGIBLE_ROLES as readonly string[]).includes(role);
}

/** Отрядная касса: все, кроме кандидатов */
export function canViewSquadTreasury(role: string | undefined | null): boolean {
    return isFighterEligibleRole(role);
}
