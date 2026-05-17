import { UserRole } from '@prisma/client';

const ROLE_LABELS_RU: Record<UserRole, string> = {
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

/** Роли, подходящие под строку поиска (русское название, код роли, подстрока). */
export function rolesMatchingSearch(query: string): UserRole[] {
  const lower = query.toLowerCase().trim();
  if (!lower) return [];

  const matched = new Set<UserRole>();
  const upper = query.toUpperCase().trim();
  if ((Object.values(UserRole) as string[]).includes(upper)) {
    matched.add(upper as UserRole);
  }

  for (const role of Object.values(UserRole)) {
    const label = ROLE_LABELS_RU[role];
    if (
      role.toLowerCase().includes(lower) ||
      label.toLowerCase().includes(lower)
    ) {
      matched.add(role);
    }
  }

  return [...matched];
}
