import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/userRepository';
import { ApiError } from './apiError';
import {
  buildUsersListQueryOptions,
  isLegacyDataImage,
  isValidImageUrl,
  normalizeImageUrl,
  normalizeUserRole,
  resolveStoredRole,
  USER_ROLES,
  USER_ROLE_VALUES,
} from './userHelpers';

export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly cloudinary: any,
  ) {}

  async getRequesterUser(requesterIdRaw: unknown) {
    const requesterId = Number(requesterIdRaw);
    if (!Number.isFinite(requesterId)) {
      throw new ApiError(401, 'Unauthorized: Invalid token payload');
    }

    const requester = await this.userRepository.findByIdWithBasicFields(requesterId);
    if (!requester) {
      throw new ApiError(401, 'Unauthorized: User not found');
    }

    const requesterRole = resolveStoredRole(requester);
    if (normalizeUserRole(requester.role) !== requesterRole) {
      await this.userRepository.updateUser(requester.id, { role: requesterRole });
    }

    return { ...requester, role: requesterRole };
  }

  async listUsers(requesterIdRaw: unknown, query: any) {
    const requester = await this.getRequesterUser(requesterIdRaw);
    const requesterIsAdmin = normalizeUserRole(requester.role) === USER_ROLES.ADMIN;
    const page = Math.max(parseInt(String(query.page || '1'), 10) || 1, 1);
    const limit = Math.max(parseInt(String(query.limit || '10'), 10) || 10, 1);
    const { search, countryCode, roleFilter, sortBy, normalizedSortOrder, where, orderBy } = buildUsersListQueryOptions(query);

    if (!requesterIsAdmin) {
      const selfUserRaw = await this.userRepository.findByIdWithProfileFields(requester.id);
      const users = selfUserRaw
        ? [{
            ...selfUserRaw,
            role: resolveStoredRole(selfUserRaw),
            img: normalizeImageUrl(selfUserRaw.img) || null,
            avatarUrl: normalizeImageUrl(selfUserRaw.img) || null,
          }]
        : [];

      return {
        users,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalUsers: users.length,
          limit: 1,
          search,
          sortBy,
          sortOrder: normalizedSortOrder,
          countryCode,
          role: roleFilter,
        },
      };
    }

    const totalUsers = await this.userRepository.countUsers(where);
    const totalPages = Math.max(Math.ceil(totalUsers / limit), 1);
    const safePage = Math.min(page, totalPages);
    const safeSkip = (safePage - 1) * limit;

    const findManyArgs: any = {
      select: {
        id: true,
        username: true,
        email: true,
        contactNo: true,
        role: true,
        img: true,
      },
      skip: safeSkip,
      take: limit,
      orderBy,
    };

    if (where) {
      findManyArgs.where = where;
    }

    const usersRaw = await this.userRepository.findManyUsers(findManyArgs);
    const users = usersRaw.map((u: any) => ({
      ...u,
      role: resolveStoredRole(u),
      img: normalizeImageUrl(u.img) || null,
      avatarUrl: normalizeImageUrl(u.img) || null,
    }));

    return {
      users,
      pagination: {
        currentPage: safePage,
        totalPages,
        totalUsers,
        limit,
        search,
        sortBy,
        sortOrder: normalizedSortOrder,
        countryCode,
        role: roleFilter,
      },
    };
  }

  async exportUsers(requesterIdRaw: unknown, query: any) {
    const requester = await this.getRequesterUser(requesterIdRaw);
    const requesterIsAdmin = normalizeUserRole(requester.role) === USER_ROLES.ADMIN;
    const { search, countryCode, roleFilter, sortBy, normalizedSortOrder, where, orderBy } = buildUsersListQueryOptions(query);

    const exportFindManyArgs: any = {
      select: {
        id: true,
        username: true,
        email: true,
        contactNo: true,
        role: true,
      },
      orderBy,
    };

    if (where) {
      exportFindManyArgs.where = where;
    }

    if (!requesterIsAdmin) {
      exportFindManyArgs.where = { id: requester.id };
    }

    const users = await this.userRepository.findManyUsers(exportFindManyArgs);

    return {
      users,
      exportMeta: {
        totalUsers: users.length,
        generatedAt: new Date().toISOString(),
        search,
        sortBy,
        sortOrder: normalizedSortOrder,
        countryCode,
        role: roleFilter,
      },
    };
  }

  async updateUserRole(requesterIdRaw: unknown, targetUserIdRaw: unknown, roleRaw: unknown) {
    const requester = await this.getRequesterUser(requesterIdRaw);
    const requesterIsAdmin = normalizeUserRole(requester.role) === USER_ROLES.ADMIN;

    if (!requesterIsAdmin) {
      throw new ApiError(403, 'Forbidden: Only admins can change user roles');
    }

    const targetUserId = parseInt(String(targetUserIdRaw), 10);
    if (!Number.isFinite(targetUserId)) {
      throw new ApiError(400, 'Invalid user id');
    }

    const requestedRole = String(roleRaw || '').trim().toUpperCase();
    if (!USER_ROLE_VALUES.has(requestedRole)) {
      throw new ApiError(400, 'Invalid role. Use ADMIN or NON_ADMIN');
    }

    const targetUser = await this.userRepository.findByIdWithBasicFields(targetUserId);
    if (!targetUser) {
      throw new ApiError(404, 'User not found');
    }

    const currentRole = normalizeUserRole(targetUser.role);
    if (currentRole === USER_ROLES.ADMIN && requestedRole === USER_ROLES.NON_ADMIN) {
      const adminCount = await this.userRepository.countAdmins();
      if (adminCount <= 1) {
        throw new ApiError(400, 'At least one admin must remain in the system');
      }
    }

    const updatedUser = await this.userRepository.updateUser(targetUserId, { role: requestedRole }, {
      id: true,
      username: true,
      email: true,
      contactNo: true,
      role: true,
      img: true,
    });

    return {
      message: 'User role updated successfully',
      user: {
        ...updatedUser,
        role: normalizeUserRole(updatedUser.role),
        img: normalizeImageUrl(updatedUser.img) || null,
        avatarUrl: normalizeImageUrl(updatedUser.img) || null,
      },
    };
  }

  async updateUserProfile(requesterIdRaw: unknown, targetUserIdRaw: unknown, payload: any) {
    const requester = await this.getRequesterUser(requesterIdRaw);

    const targetUserId = parseInt(String(targetUserIdRaw), 10);
    if (!Number.isFinite(targetUserId)) {
      throw new ApiError(400, 'Invalid user id');
    }

    const requesterIsAdmin = normalizeUserRole(requester.role) === USER_ROLES.ADMIN;
    if (!requesterIsAdmin && requester.id !== targetUserId) {
      throw new ApiError(403, 'Forbidden: You can only edit your own profile');
    }

    const { username, email, contactNo, password, img, avatarUrl } = payload || {};
    let resolvedImageUrl = normalizeImageUrl(img !== undefined ? img : avatarUrl);

    if (username && String(username).trim().length < 3) {
      throw new ApiError(400, 'Username must be at least 3 characters long');
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (email && !emailRegex.test(String(email))) {
      throw new ApiError(400, 'Please provide a valid @gmail.com address');
    }

    const phoneRegex = /^\+[0-9]{1,4}[0-9]{9}$/;
    if (contactNo !== undefined && !phoneRegex.test(String(contactNo).trim())) {
      throw new ApiError(400, 'Contact number must include a valid country code and exactly 9 digits');
    }

    if (password !== undefined && String(password).trim().length > 0 && String(password).length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters long');
    }

    if (resolvedImageUrl !== undefined && resolvedImageUrl !== null && isLegacyDataImage(resolvedImageUrl)) {
      const uploaded = await this.cloudinary.uploader.upload(resolvedImageUrl, {
        folder: 'user-management',
        resource_type: 'image',
      });
      resolvedImageUrl = uploaded.secure_url;
    }

    if (resolvedImageUrl !== undefined && resolvedImageUrl !== null && !isValidImageUrl(resolvedImageUrl)) {
      throw new ApiError(400, 'Image URL must be a valid http/https URL');
    }

    const updateData: any = {
      username,
      email,
      contactNo: contactNo !== undefined ? String(contactNo).trim() : undefined,
    };

    if (resolvedImageUrl !== undefined) {
      updateData.img = resolvedImageUrl;
    }

    if (password !== undefined && String(password).trim().length > 0) {
      updateData.password = await bcrypt.hash(String(password), 10);
    }

    const updatedUser: any = await this.userRepository.updateUser(targetUserId, updateData);
    const normalizedUpdatedRole = resolveStoredRole(updatedUser);

    if (normalizedUpdatedRole !== normalizeUserRole(updatedUser.role)) {
      await this.userRepository.updateUser(updatedUser.id, { role: normalizedUpdatedRole });
      updatedUser.role = normalizedUpdatedRole;
    }

    return {
      message: 'User updated',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        contactNo: updatedUser.contactNo,
        role: resolveStoredRole(updatedUser),
        img: normalizeImageUrl(updatedUser.img) || null,
        avatarUrl: normalizeImageUrl(updatedUser.img) || null,
      },
    };
  }

  async deleteUser(requesterIdRaw: unknown, targetUserIdRaw: unknown) {
    const requester = await this.getRequesterUser(requesterIdRaw);

    const targetUserId = parseInt(String(targetUserIdRaw), 10);
    if (!Number.isFinite(targetUserId)) {
      throw new ApiError(400, 'Invalid user id');
    }

    const requesterIsAdmin = normalizeUserRole(requester.role) === USER_ROLES.ADMIN;
    if (!requesterIsAdmin && requester.id !== targetUserId) {
      throw new ApiError(403, 'Forbidden: You can only delete your own profile');
    }

    await this.userRepository.deleteUser(targetUserId);
    return { message: 'User deleted successfully' };
  }
}
