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
