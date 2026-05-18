import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { isManagementLeaderRole } from '../common/leader-roles';

export interface CreateMaterialInput {
  title: string;
  fileUrl: string;
  fileName: string;
  mimeType?: string | null;
  allowedRoles?: UserRole[];
  allowedUserIds?: string[];
}

export interface UpdateMaterialInput {
  title?: string;
  allowedRoles?: UserRole[];
  allowedUserIds?: string[];
}

@Injectable()
export class MaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  private canAccess(
    material: {
      roleAccess: { role: UserRole }[];
      userAccess: { userId: string }[];
    },
    userId: string,
    role: UserRole,
  ): boolean {
    const hasRoles = material.roleAccess.length > 0;
    const hasUsers = material.userAccess.length > 0;
    if (!hasRoles && !hasUsers) return true;
    if (material.roleAccess.some((r) => r.role === role)) return true;
    return material.userAccess.some((u) => u.userId === userId);
  }

  async listForUser(userId: string, role: UserRole) {
    const all = await this.prisma.material.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        roleAccess: true,
        userAccess: true,
        uploadedBy: { select: { id: true, fullName: true } },
      },
    });
    return all.filter((m) => this.canAccess(m, userId, role));
  }

  async listAllAdmin() {
    return this.prisma.material.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        roleAccess: true,
        userAccess: {
          include: {
            user: { select: { id: true, fullName: true, vkId: true } },
          },
        },
        uploadedBy: { select: { id: true, fullName: true } },
      },
    });
  }

  async create(uploaderId: string, input: CreateMaterialInput) {
    const roles = input.allowedRoles ?? [];
    const userIds = input.allowedUserIds ?? [];

    return this.prisma.material.create({
      data: {
        title: input.title.trim(),
        fileUrl: input.fileUrl,
        fileName: input.fileName,
        mimeType: input.mimeType ?? null,
        uploadedById: uploaderId,
        roleAccess: {
          create: roles.map((role) => ({ role })),
        },
        userAccess: {
          create: userIds.map((userId) => ({ userId })),
        },
      },
      include: {
        roleAccess: true,
        userAccess: {
          include: {
            user: { select: { id: true, fullName: true, vkId: true } },
          },
        },
        uploadedBy: { select: { id: true, fullName: true } },
      },
    });
  }

  async update(id: string, input: UpdateMaterialInput) {
    const existing = await this.prisma.material.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Документ не найден');

    if (input.allowedRoles !== undefined) {
      await this.prisma.materialRoleAccess.deleteMany({
        where: { materialId: id },
      });
      if (input.allowedRoles.length > 0) {
        await this.prisma.materialRoleAccess.createMany({
          data: input.allowedRoles.map((role) => ({ materialId: id, role })),
        });
      }
    }

    if (input.allowedUserIds !== undefined) {
      await this.prisma.materialUserAccess.deleteMany({
        where: { materialId: id },
      });
      if (input.allowedUserIds.length > 0) {
        await this.prisma.materialUserAccess.createMany({
          data: input.allowedUserIds.map((userId) => ({
            materialId: id,
            userId,
          })),
        });
      }
    }

    return this.prisma.material.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      },
      include: {
        roleAccess: true,
        userAccess: {
          include: {
            user: { select: { id: true, fullName: true, vkId: true } },
          },
        },
        uploadedBy: { select: { id: true, fullName: true } },
      },
    });
  }

  async delete(id: string) {
    const existing = await this.prisma.material.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Документ не найден');
    await this.prisma.material.delete({ where: { id } });
    return { ok: true };
  }

  async assertCanDownload(materialId: string, userId: string, role: UserRole) {
    const material = await this.prisma.material.findUnique({
      where: { id: materialId },
      include: { roleAccess: true, userAccess: true },
    });
    if (!material) throw new NotFoundException('Документ не найден');
    if (!this.canAccess(material, userId, role)) {
      throw new ForbiddenException('Нет доступа к документу');
    }
    return material;
  }

  assertAdmin(role: string) {
    if (!isManagementLeaderRole(role)) {
      throw new ForbiddenException('Только для комсостава');
    }
  }
}
