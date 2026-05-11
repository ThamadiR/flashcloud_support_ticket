export const USER_ROLES = {
  ADMIN: 'ADMIN',
  TICKET_SUPERVISOR: 'TICKET_SUPERVISOR',
  TICKET_AGENT: 'TICKET_AGENT',
} as const;

export const USER_ROLE_VALUES = new Set<string>(Object.values(USER_ROLES));

const USER_SORT_FIELD_MAP: Record<string, 'id' | 'username' | 'email' | 'contactNo' | 'role'> = {
  id: 'id',
  username: 'username',
  email: 'email',
  country: 'contactNo',
  role: 'role',
  newest: 'id',
  oldest: 'id',
};

export const normalizeImageUrl = (value: unknown): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const normalized = String(value).trim();
  if (!normalized || normalized.toLowerCase() === 'null') {
    return null;
  }

  return normalized;
};

export const normalizeUserRole = (value: unknown): string => {
  if (typeof value !== 'string') {
    return USER_ROLES.NON_ADMIN;
  }

  const normalized = value.trim().toUpperCase().replace(/[-\s]+/g, '_');
  return USER_ROLE_VALUES.has(normalized) ? normalized : USER_ROLES.NON_ADMIN;
};

export const resolveStoredRole = (user: { role?: unknown }) => normalizeUserRole(user.role);

export const isLegacyDataImage = (value: unknown) => typeof value === 'string' && /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(value);

export const isValidImageUrl = (value: unknown) => {
  if (typeof value !== 'string' || !value.trim()) {
    return false;
  }

  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const buildUsersListQueryOptions = (query: any) => {
  const search = String(query.search || '').trim();
  const countryCode = String(query.countryCode || '').trim();
  const roleRaw = String(query.role || '').trim();
  const roleFilter = normalizeUserRole(roleRaw);
  const hasRoleFilter = roleRaw.length > 0;
  const sortByRaw = String(query.sortBy || 'id').trim();
  const sortOrderRaw = String(query.sortOrder || 'asc').toLowerCase();
  const sortOrder: 'asc' | 'desc' = sortOrderRaw === 'desc' ? 'desc' : 'asc';

  const sortBy = (USER_SORT_FIELD_MAP[sortByRaw] ? sortByRaw : 'id') as keyof typeof USER_SORT_FIELD_MAP;
  const normalizedSortOrder: 'asc' | 'desc' = sortBy === 'newest' ? 'desc' : sortBy === 'oldest' ? 'asc' : sortOrder;
  const orderField: 'id' | 'username' | 'email' | 'contactNo' | 'role' = USER_SORT_FIELD_MAP[sortBy] || 'id';

  const searchWhere = search
    ? {
        OR: [
          { username: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { contactNo: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : undefined;

  const countryWhere = countryCode
    ? {
        contactNo: { startsWith: countryCode },
      }
    : undefined;

  const roleWhere = hasRoleFilter
    ? {
        role: roleFilter,
      }
    : undefined;

  const andFilters = [searchWhere, countryWhere, roleWhere].filter(Boolean) as any[];
  const where = andFilters.length > 1 ? { AND: andFilters } : andFilters[0];

  return {
    search,
    countryCode,
    roleFilter: hasRoleFilter ? roleFilter : '',
    sortBy,
    normalizedSortOrder,
    where,
    orderBy: { [orderField]: normalizedSortOrder },
  };
};
